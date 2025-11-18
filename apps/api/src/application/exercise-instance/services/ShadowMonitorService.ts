import { Injectable, Logger } from "@nestjs/common";
import { OpenAIService } from "../../../infrastructure/ai/OpenAIService";

/**
 * ShadowMonitorService
 *
 * Service for semantic evaluation of student interactions in exercises.
 * Runs in parallel with the main AI conversation to evaluate criteria
 * fulfillment without breaking character immersion.
 *
 * Used by:
 * - Simulación de Interacción: Evaluate success criteria based on conversation quality
 * - Mentor/Asesor IA: Validate semantic quality of student reflections
 * - Metacognición: Extract and count insights from student responses
 */
@Injectable()
export class ShadowMonitorService {
  private readonly logger = new Logger(ShadowMonitorService.name);

  constructor(private readonly openAIService: OpenAIService) {}

  /**
   * Evaluate simulation interaction criteria
   * Returns which criteria were met based on recent conversation
   */
  async evaluateSimulationCriteria(params: {
    recentMessages: Array<{ role: string; content: string }>;
    criteriaToEvaluate: Array<{
      id: string;
      descripcion: string;
      rubrica_evaluacion?: string;
    }>;
    alreadyMetCriteria: string[];
  }): Promise<{
    metCriteriaIds: string[];
    qualityScores: Record<string, number>;
    internalFeedback: string;
  }> {
    this.logger.debug("🔍 Shadow Monitor: Evaluating simulation criteria");

    const systemPrompt = `You are a pedagogical evaluator analyzing student interaction quality.

Your job is to assess whether the student has authentically demonstrated the success criteria based on their conversation behavior.

IMPORTANT PRINCIPLES:
- Evaluate BEHAVIOR and TECHNIQUE, not just keyword presence
- A student saying "I met the criteria" does NOT count as meeting it
- Look for genuine application of the skills (e.g., empathy, active listening, professionalism)
- Be strict: Only mark criteria as met if there's clear evidence

ALREADY MET CRITERIA:
${params.alreadyMetCriteria.join(", ") || "None yet"}

CRITERIA TO EVALUATE:
${params.criteriaToEvaluate
  .map(
    (c) =>
      `- ID: ${c.id}\n  Description: ${c.descripcion}\n  Rubric: ${c.rubrica_evaluacion || "Evaluate based on description"}`,
  )
  .join("\n\n")}

RECENT CONVERSATION:
${params.recentMessages
  .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
  .join("\n\n")}

Analyze the student's messages and determine which criteria (if any) have been authentically demonstrated.

Respond with JSON:
{
  "met_criteria_ids": ["id1", "id2"],
  "quality_scores": {
    "id1": 4,
    "id2": 3
  },
  "internal_feedback": "Brief explanation of evaluation"
}

Quality scores: 1-5 (1=poor, 3=adequate, 5=excellent). Only include scores for criteria that were met (score >= 3).`;

    try {
      const response = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [
          {
            role: "user",
            content:
              "Analyze the conversation and determine which criteria were met.",
          },
        ],
        maxTokens: 500,
        responseFormat: { type: "json_object" },
        model: "gpt-5-nano", // Use faster/cheaper model for evaluation
      });

      const parsed = JSON.parse(response.content);

      return {
        metCriteriaIds: parsed.met_criteria_ids || [],
        qualityScores: parsed.quality_scores || {},
        internalFeedback: parsed.internal_feedback || "",
      };
    } catch (error) {
      this.logger.error("Shadow Monitor evaluation failed", error);
      return {
        metCriteriaIds: [],
        qualityScores: {},
        internalFeedback: "Evaluation failed",
      };
    }
  }

  /**
   * Validate semantic quality of mentor step response
   * Returns whether the response meets quality standards
   */
  async validateMentorStepQuality(params: {
    studentResponse: string;
    stepTitle: string;
    evaluationCriteria: string[];
    qualityThreshold: number; // 1-5
  }): Promise<{
    isValid: boolean;
    qualityScore: number;
    feedback: string;
    missingAspects: string[];
  }> {
    this.logger.debug("🔍 Shadow Monitor: Validating mentor step quality");

    const systemPrompt = `You are a pedagogical evaluator assessing the quality of a student's reflection.

STEP: ${params.stepTitle}

EVALUATION CRITERIA:
${params.evaluationCriteria.map((c, i) => `${i + 1}. ${c}`).join("\n")}

QUALITY THRESHOLD: ${params.qualityThreshold}/5 (student must score at least this to pass)

STUDENT'S RESPONSE:
${params.studentResponse}

Evaluate whether the response demonstrates adequate depth and addresses the criteria.

EVALUATION RULES:
- Check if response addresses each criterion
- Look for concrete examples, not just abstract statements
- Assess depth of reasoning and justification
- Identify which aspects are missing or superficial

Respond with JSON:
{
  "is_valid": true/false,
  "quality_score": 1-5,
  "feedback": "Specific feedback on what's missing or what's good",
  "missing_aspects": ["aspect1", "aspect2"]
}`;

    try {
      const response = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: "Evaluate the quality of this response.",
          },
        ],
        maxTokens: 400,
        responseFormat: { type: "json_object" },
        model: "gpt-5-nano",
      });

      const parsed = JSON.parse(response.content);

      return {
        isValid:
          parsed.is_valid && parsed.quality_score >= params.qualityThreshold,
        qualityScore: parsed.quality_score || 1,
        feedback: parsed.feedback || "",
        missingAspects: parsed.missing_aspects || [],
      };
    } catch (error) {
      this.logger.error("Mentor step validation failed", error);
      return {
        isValid: false,
        qualityScore: 1,
        feedback: "Validation failed - please try again",
        missingAspects: [],
      };
    }
  }

  /**
   * Extract and count insights from metacognition conversation
   * Returns insight count and detected insights
   */
  async extractMetacognitionInsights(params: {
    recentMessages: Array<{ role: string; content: string }>;
    currentInsightCount: number;
  }): Promise<{
    insightCount: number;
    latestInsight: string | null;
    detectedInsights: string[];
  }> {
    this.logger.debug("🔍 Shadow Monitor: Extracting metacognition insights");

    const systemPrompt = `You are a metacognition facilitator analyzing student reflections for actionable insights.

An INSIGHT is a clear causal connection about their learning process, such as:
- "I realized I learn better when I draw diagrams"
- "I noticed I get stuck when I try to memorize instead of understand"
- "I discovered that taking breaks helps me retain information"

NOT insights (too vague):
- "It was hard"
- "I learned a lot"
- "This was interesting"

CURRENT INSIGHT COUNT: ${params.currentInsightCount}

RECENT CONVERSATION:
${params.recentMessages
  .filter((msg) => msg.role === "user") // Only analyze student messages
  .map((msg) => msg.content)
  .join("\n\n")}

Identify any NEW actionable insights in the student's latest messages.

Respond with JSON:
{
  "detected_insights": ["insight1", "insight2"],
  "insight_count": total_count,
  "latest_insight": "most recent insight or null"
}`;

    try {
      const response = await this.openAIService.generateChatResponse({
        systemPrompt,
        messages: [
          {
            role: "user",
            content: "Identify insights from the student's reflections.",
          },
        ],
        maxTokens: 300,
        responseFormat: { type: "json_object" },
        model: "gpt-5-nano",
      });

      const parsed = JSON.parse(response.content);

      return {
        insightCount: parsed.insight_count || params.currentInsightCount,
        latestInsight: parsed.latest_insight || null,
        detectedInsights: parsed.detected_insights || [],
      };
    } catch (error) {
      this.logger.error("Insight extraction failed", error);
      return {
        insightCount: params.currentInsightCount,
        latestInsight: null,
        detectedInsights: [],
      };
    }
  }
}
