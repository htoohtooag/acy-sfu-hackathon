"use client";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SampleWorkOrder, SampleWorkText, SampleWorkUpdate } from 'shared/schemas';
import { createSampleWork, deleteSampleWork, getSampleWorks, reorderSampleWorks, updateSampleWork } from './sample-work-api';
export function useSampleWorks(enabled = true) { return useQuery({ queryKey: ['sample-works'], queryFn: getSampleWorks, enabled }); }
export function useCreateSampleWork() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ input, file }: { input: SampleWorkText; file: File }) => createSampleWork(input, file), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sample-works'] }) }); }
export function useUpdateSampleWork() { const queryClient = useQueryClient(); return useMutation({ mutationFn: ({ id, input, file }: { id: string; input: SampleWorkUpdate; file?: File }) => updateSampleWork(id, input, file), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sample-works'] }) }); }
export function useDeleteSampleWork() { const queryClient = useQueryClient(); return useMutation({ mutationFn: deleteSampleWork, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sample-works'] }) }); }
export function useReorderSampleWorks() { const queryClient = useQueryClient(); return useMutation({ mutationFn: (input: SampleWorkOrder) => reorderSampleWorks(input), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sample-works'] }) }); }
