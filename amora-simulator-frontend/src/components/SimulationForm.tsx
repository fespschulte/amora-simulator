// components/SimulationForm.tsx
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { motion } from "framer-motion";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

const formSchema = z.object({
  property_value: z.string().refine(
    (val) => {
      const num = Number(val.replace(/\D/g, ""));
      return !isNaN(num) && num > 0;
    },
    {
      message: "Por favor, insira um valor válido para o imóvel.",
    }
  ),
  down_payment_percentage: z
    .number()
    .min(10, { message: "Entrada mínima de 10%" })
    .max(90, { message: "Entrada máxima de 90%" }),
  contract_years: z
    .number()
    .int()
    .min(1, { message: "Mínimo de 1 ano" })
    .max(35, { message: "Máximo de 35 anos" }),
  simulation_name: z.string().optional(),
  notes: z.string().optional(),
});

interface SimulationFormProps {
  onSubmit?: (data: z.infer<typeof formSchema>) => void;
  initialData?: Partial<z.infer<typeof formSchema>>;
  isLoading?: boolean;
}

export function SimulationForm({
  onSubmit,
  initialData,
  isLoading = false,
}: SimulationFormProps) {
  const [simulationResult, setSimulationResult] = useState<{
    down_payment_value: number;
    financing_amount: number;
    additional_costs: number;
    monthly_savings: number;
  } | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      property_value: initialData?.property_value || "",
      down_payment_percentage: initialData?.down_payment_percentage || 20,
      contract_years: initialData?.contract_years || 30,
      simulation_name: initialData?.simulation_name || "",
      notes: initialData?.notes || "",
    },
  });

  // Format currency input (R$)
  const formatCurrency = (value: string) => {
    const onlyNums = value.replace(/\D/g, "");
    if (onlyNums === "") return "";
    const numberValue = Number(onlyNums) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  // Calculate simulation values
  const calculateSimulation = (values: z.infer<typeof formSchema>) => {
    const propertyValue =
      Number(values.property_value.replace(/\D/g, "")) / 100;
    const downPaymentPercentage = values.down_payment_percentage;
    const contractYears = values.contract_years;

    // Using the formulas provided in the requirements
    const downPaymentValue = propertyValue * (downPaymentPercentage / 100);
    const financingAmount = propertyValue - downPaymentValue;
    const additionalCosts = propertyValue * 0.15; // 15% for additional costs
    const monthlySavings = additionalCosts / (contractYears * 12);

    return {
      down_payment_value: downPaymentValue,
      financing_amount: financingAmount,
      additional_costs: additionalCosts,
      monthly_savings: monthlySavings,
    };
  };

  function handleSubmit(values: z.infer<typeof formSchema>) {
    const results = calculateSimulation(values);
    setSimulationResult(results);

    if (onSubmit) {
      onSubmit(values);
    } else {
      // Default behavior if no onSubmit is provided
      console.log({
        ...values,
        ...results,
      });
    }
  }

  // Watch form values for real-time calculations
  const watchPropertyValue = form.watch("property_value");
  const watchDownPaymentPercentage = form.watch("down_payment_percentage");
  const watchContractYears = form.watch("contract_years");

  // Real-time calculation for display
  let realtimeCalculation = null;
  if (watchPropertyValue) {
    const propertyValue = Number(watchPropertyValue.replace(/\D/g, "")) / 100;
    if (propertyValue > 0) {
      realtimeCalculation = {
        down_payment_value: propertyValue * (watchDownPaymentPercentage / 100),
        financing_amount:
          propertyValue * (1 - watchDownPaymentPercentage / 100),
        additional_costs: propertyValue * 0.15,
        monthly_savings: (propertyValue * 0.15) / (watchContractYears * 12),
      };
    }
  }

  const formatValue = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl p-6 space-y-8 bg-white rounded-lg shadow-lg dark:bg-gray-800"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold">Simulador de Compra de Imóvel</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Calcule os valores para a compra do seu imóvel
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <FormField
                control={form.control}
                name="property_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Imóvel</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="R$ 0,00"
                        {...field}
                        onChange={(e) => {
                          const formatted = formatCurrency(e.target.value);
                          field.onChange(formatted);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="down_payment_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Percentual de Entrada: {field.value}%</FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[field.value]}
                        min={10}
                        max={90}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contract_years"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Anos de Contrato: {field.value}{" "}
                      {field.value === 1 ? "ano" : "anos"}
                    </FormLabel>
                    <FormControl>
                      <Slider
                        defaultValue={[field.value]}
                        min={1}
                        max={35}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="simulation_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Simulação (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Apartamento Centro" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notas (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Observações sobre a simulação"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              {realtimeCalculation && (
                <Card>
                  <CardHeader>
                    <CardTitle>Simulação em tempo real</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Valor da Entrada
                      </p>
                      <p className="text-lg font-semibold">
                        {formatValue(realtimeCalculation.down_payment_value)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Valor a Financiar
                      </p>
                      <p className="text-lg font-semibold">
                        {formatValue(realtimeCalculation.financing_amount)}
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Total a Guardar (15% para custos adicionais)
                      </p>
                      <p className="text-lg font-semibold">
                        {formatValue(realtimeCalculation.additional_costs)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Valor Mensal de Poupança
                      </p>
                      <p className="text-lg font-semibold">
                        {formatValue(realtimeCalculation.monthly_savings)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                Salvando...
              </>
            ) : (
              "Salvar Simulação"
            )}
          </Button>
        </form>
      </Form>

      {simulationResult && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Resultado da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Valor da Entrada
                  </p>
                  <p className="text-lg font-semibold">
                    {formatValue(simulationResult.down_payment_value)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Valor a Financiar
                  </p>
                  <p className="text-lg font-semibold">
                    {formatValue(simulationResult.financing_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Total a Guardar (15% para custos adicionais)
                  </p>
                  <p className="text-lg font-semibold">
                    {formatValue(simulationResult.additional_costs)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Valor Mensal de Poupança
                  </p>
                  <p className="text-lg font-semibold">
                    {formatValue(simulationResult.monthly_savings)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
