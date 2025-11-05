'use client';

import { useState, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

// ============================================================================
// TIPOS
// ============================================================================

interface Descriptor {
  nivel: string;
  puntos: number;
  descripcion: string;
}

interface Dimension {
  nombre: string;
  peso: number;
  descriptores: Descriptor[];
}

interface Rubrica {
  id?: string;
  componenteId: string;
  dimensiones: Dimension[];
  pesosValidados: boolean;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

interface RubricaEditorProps {
  componenteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RubricaEditor({
  componenteId,
  open,
  onOpenChange,
}: RubricaEditorProps) {
  // Cargar rúbrica existente
  const { data: rubricaExistente, error } = useSWR<Rubrica>(
    open ? `/api/v1/componentes/${componenteId}/rubrica` : null,
    {
      shouldRetryOnError: false, // No reintentar si no existe
    }
  );

  // Estado local
  const [dimensiones, setDimensiones] = useState<Dimension[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Inicializar dimensiones cuando carga la rúbrica
  useEffect(() => {
    if (rubricaExistente?.dimensiones) {
      setDimensiones(rubricaExistente.dimensiones);
    } else if (open && !rubricaExistente) {
      // Si no existe rúbrica, inicializar con una dimensión vacía
      setDimensiones([crearDimensionVacia()]);
    }
  }, [rubricaExistente, open]);

  // Calcular suma total de pesos
  const pesoTotal = dimensiones.reduce((sum, dim) => sum + dim.peso, 0);
  const esValido = Math.abs(pesoTotal - 100) < 0.01;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const agregarDimension = () => {
    setDimensiones([...dimensiones, crearDimensionVacia()]);
  };

  const eliminarDimension = (index: number) => {
    if (dimensiones.length > 1) {
      setDimensiones(dimensiones.filter((_, i) => i !== index));
    } else {
      toast({
        title: 'Error',
        description: 'Debe haber al menos una dimensión',
        variant: 'destructive',
      });
    }
  };

  const actualizarDimension = (
    index: number,
    campo: keyof Dimension,
    valor: any
  ) => {
    const nuevasDimensiones = [...dimensiones];
    nuevasDimensiones[index] = {
      ...nuevasDimensiones[index],
      [campo]: valor,
    };
    setDimensiones(nuevasDimensiones);
  };

  const agregarDescriptor = (dimensionIndex: number) => {
    const nuevasDimensiones = [...dimensiones];
    nuevasDimensiones[dimensionIndex].descriptores.push({
      nivel: '',
      puntos: 0,
      descripcion: '',
    });
    setDimensiones(nuevasDimensiones);
  };

  const eliminarDescriptor = (dimensionIndex: number, descriptorIndex: number) => {
    const nuevasDimensiones = [...dimensiones];
    if (nuevasDimensiones[dimensionIndex].descriptores.length > 1) {
      nuevasDimensiones[dimensionIndex].descriptores.splice(descriptorIndex, 1);
      setDimensiones(nuevasDimensiones);
    } else {
      toast({
        title: 'Error',
        description: 'Debe haber al menos un descriptor por dimensión',
        variant: 'destructive',
      });
    }
  };

  const actualizarDescriptor = (
    dimensionIndex: number,
    descriptorIndex: number,
    campo: keyof Descriptor,
    valor: any
  ) => {
    const nuevasDimensiones = [...dimensiones];
    nuevasDimensiones[dimensionIndex].descriptores[descriptorIndex] = {
      ...nuevasDimensiones[dimensionIndex].descriptores[descriptorIndex],
      [campo]: valor,
    };
    setDimensiones(nuevasDimensiones);
  };

  const guardarRubrica = async () => {
    if (!esValido) {
      toast({
        title: 'Error de validación',
        description: `La suma de los pesos debe ser 100. Suma actual: ${pesoTotal.toFixed(2)}`,
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        componenteId,
        dimensiones,
        pesosValidados: true,
      };

      const method = rubricaExistente?.id ? 'PUT' : 'POST';
      const url = rubricaExistente?.id
        ? `/api/v1/contenido/rubrica/${rubricaExistente.id}`
        : `/api/v1/componentes/${componenteId}/rubrica`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al guardar la rúbrica');
      }

      // Revalidar la rúbrica
      mutate(`/api/v1/componentes/${componenteId}/rubrica`);

      toast({
        title: 'Éxito',
        description: rubricaExistente?.id
          ? 'Rúbrica actualizada correctamente'
          : 'Rúbrica creada correctamente',
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {rubricaExistente?.id ? 'Editar Rúbrica' : 'Crear Rúbrica'}
          </DialogTitle>
          <DialogDescription>
            Define las dimensiones de evaluación y sus descriptores. Los pesos
            deben sumar exactamente 100.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Indicador de Peso Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-lg font-semibold">
                    Peso Total: {pesoTotal.toFixed(2)} / 100
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {esValido
                      ? 'Los pesos están balanceados correctamente'
                      : 'Ajusta los pesos para que sumen exactamente 100'}
                  </p>
                </div>
                {esValido ? (
                  <Badge variant="default" className="flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Válido
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    Inválido
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Dimensiones */}
          <div className="space-y-4">
            {dimensiones.map((dimension, dimIndex) => (
              <DimensionCard
                key={dimIndex}
                dimension={dimension}
                index={dimIndex}
                onUpdate={actualizarDimension}
                onDelete={eliminarDimension}
                onAddDescriptor={agregarDescriptor}
                onUpdateDescriptor={actualizarDescriptor}
                onDeleteDescriptor={eliminarDescriptor}
                canDelete={dimensiones.length > 1}
              />
            ))}
          </div>

          {/* Botón Agregar Dimensión */}
          <Button
            type="button"
            variant="outline"
            onClick={agregarDimension}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Dimensión
          </Button>

          {/* Advertencia si no es válido */}
          {!esValido && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No puedes guardar la rúbrica hasta que los pesos sumen
                exactamente 100. Suma actual: {pesoTotal.toFixed(2)}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button onClick={guardarRubrica} disabled={!esValido || isLoading}>
            {isLoading ? 'Guardando...' : 'Guardar Rúbrica'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// COMPONENTE: DIMENSION CARD
// ============================================================================

interface DimensionCardProps {
  dimension: Dimension;
  index: number;
  onUpdate: (index: number, campo: keyof Dimension, valor: any) => void;
  onDelete: (index: number) => void;
  onAddDescriptor: (index: number) => void;
  onUpdateDescriptor: (
    dimIndex: number,
    descIndex: number,
    campo: keyof Descriptor,
    valor: any
  ) => void;
  onDeleteDescriptor: (dimIndex: number, descIndex: number) => void;
  canDelete: boolean;
}

function DimensionCard({
  dimension,
  index,
  onUpdate,
  onDelete,
  onAddDescriptor,
  onUpdateDescriptor,
  onDeleteDescriptor,
  canDelete,
}: DimensionCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <CardTitle className="text-lg">Dimensión {index + 1}</CardTitle>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor={`dimension-${index}-nombre`}>Nombre</Label>
                <Input
                  id={`dimension-${index}-nombre`}
                  value={dimension.nombre}
                  onChange={(e) => onUpdate(index, 'nombre', e.target.value)}
                  placeholder="ej. Claridad de Ideas"
                />
              </div>
              <div>
                <Label htmlFor={`dimension-${index}-peso`}>
                  Peso (%)
                </Label>
                <Input
                  id={`dimension-${index}-peso`}
                  type="number"
                  min={0}
                  max={100}
                  value={dimension.peso}
                  onChange={(e) =>
                    onUpdate(index, 'peso', parseFloat(e.target.value) || 0)
                  }
                  placeholder="0-100"
                />
              </div>
            </div>
          </div>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(index)}
              className="ml-2"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Label className="text-sm font-medium">Descriptores (Niveles de Logro)</Label>
          {dimension.descriptores.map((descriptor, descIndex) => (
            <DescriptorRow
              key={descIndex}
              descriptor={descriptor}
              dimIndex={index}
              descIndex={descIndex}
              onUpdate={onUpdateDescriptor}
              onDelete={onDeleteDescriptor}
              canDelete={dimension.descriptores.length > 1}
            />
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onAddDescriptor(index)}
            className="w-full"
          >
            <Plus className="h-3 w-3 mr-1" />
            Agregar Descriptor
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// COMPONENTE: DESCRIPTOR ROW
// ============================================================================

interface DescriptorRowProps {
  descriptor: Descriptor;
  dimIndex: number;
  descIndex: number;
  onUpdate: (
    dimIndex: number,
    descIndex: number,
    campo: keyof Descriptor,
    valor: any
  ) => void;
  onDelete: (dimIndex: number, descIndex: number) => void;
  canDelete: boolean;
}

function DescriptorRow({
  descriptor,
  dimIndex,
  descIndex,
  onUpdate,
  onDelete,
  canDelete,
}: DescriptorRowProps) {
  return (
    <div className="flex gap-2 items-start p-3 border rounded-lg bg-muted/50">
      <div className="flex-1 grid grid-cols-3 gap-2">
        <div>
          <Input
            value={descriptor.nivel}
            onChange={(e) =>
              onUpdate(dimIndex, descIndex, 'nivel', e.target.value)
            }
            placeholder="Nivel (ej. Excelente)"
            className="text-sm"
          />
        </div>
        <div>
          <Input
            type="number"
            min={0}
            max={100}
            value={descriptor.puntos}
            onChange={(e) =>
              onUpdate(
                dimIndex,
                descIndex,
                'puntos',
                parseFloat(e.target.value) || 0
              )
            }
            placeholder="Puntos (0-100)"
            className="text-sm"
          />
        </div>
        <div>
          <Textarea
            value={descriptor.descripcion}
            onChange={(e) =>
              onUpdate(dimIndex, descIndex, 'descripcion', e.target.value)
            }
            placeholder="Descripción del criterio"
            className="text-sm min-h-[60px]"
            rows={2}
          />
        </div>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(dimIndex, descIndex)}
          className="shrink-0"
        >
          <Trash2 className="h-3 w-3 text-destructive" />
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// UTILIDADES
// ============================================================================

function crearDimensionVacia(): Dimension {
  return {
    nombre: '',
    peso: 0,
    descriptores: [
      {
        nivel: '',
        puntos: 0,
        descripcion: '',
      },
    ],
  };
}
