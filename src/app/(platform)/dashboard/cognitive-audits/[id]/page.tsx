import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { cn } from '@/lib/utils';

interface PageProps {
  params: {
    id: string;
  };
}

async function getAnalysis(id: string, userId: string) {
  try {
    const analysis = await prisma.analysis.findUnique({
      where: { id },
      include: {
        document: true,
        biases: true,
      },
    });

    if (!analysis) return null;

    // Check if user has access
    if (analysis.document.userId !== userId) {
      const membership = await prisma.teamMember.findFirst({
        where: { userId },
      });

      if (!membership || membership.orgId !== analysis.document.orgId) {
        return null;
      }
    }

    return analysis;
  } catch (error) {
    console.error('Error fetching analysis:', error);
    return null;
  }
}

export default async function CognitiveAuditDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    notFound();
  }

  const analysis = await getAnalysis(params.id, user.id);

  if (!analysis) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Cognitive Audit Detail
        </h1>
        <p className="text-gray-400">
          {analysis.document.filename}
        </p>
      </div>

      {/* Overall Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className={cn(
          'p-6 rounded-xl',
          'liquid-glass-premium',
          'border border-white/10'
        )}>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Overall Score</h3>
          <p className="text-3xl font-bold text-white">
            {Math.round(analysis.overallScore)}/100
          </p>
        </div>

        <div className={cn(
          'p-6 rounded-xl',
          'liquid-glass-premium',
          'border border-white/10'
        )}>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Noise Score</h3>
          <p className="text-3xl font-bold text-white">
            {Math.round(analysis.noiseScore)}/100
          </p>
        </div>

        <div className={cn(
          'p-6 rounded-xl',
          'liquid-glass-premium',
          'border border-white/10'
        )}>
          <h3 className="text-sm font-medium text-gray-400 mb-2">Biases Detected</h3>
          <p className="text-3xl font-bold text-white">
            {analysis.biases.length}
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className={cn(
        'p-6 rounded-xl mb-8',
        'liquid-glass',
        'border border-white/10'
      )}>
        <h2 className="text-xl font-semibold text-white mb-4">Summary</h2>
        <p className="text-gray-300 leading-relaxed">
          {analysis.summary}
        </p>
      </div>

      {/* Detected Biases */}
      {analysis.biases.length > 0 && (
        <div className={cn(
          'p-6 rounded-xl',
          'liquid-glass',
          'border border-white/10'
        )}>
          <h2 className="text-xl font-semibold text-white mb-4">Detected Biases</h2>
          <div className="space-y-4">
            {analysis.biases.map((bias) => (
              <div
                key={bias.id}
                className={cn(
                  'p-4 rounded-lg',
                  'bg-white/5',
                  'border border-white/10'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-white">
                    {bias.biasType}
                  </h3>
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    bias.severity === 'critical' && 'bg-red-500/20 text-red-400',
                    bias.severity === 'high' && 'bg-orange-500/20 text-orange-400',
                    bias.severity === 'medium' && 'bg-yellow-500/20 text-yellow-400',
                    bias.severity === 'low' && 'bg-green-500/20 text-green-400'
                  )}>
                    {bias.severity}
                  </span>
                </div>

                <p className="text-gray-400 text-sm mb-2">
                  {bias.explanation}
                </p>

                {bias.excerpt && (
                  <blockquote className="pl-4 border-l-2 border-white/20 text-gray-500 text-sm italic">
                    "{bias.excerpt}"
                  </blockquote>
                )}

                {bias.suggestion && (
                  <div className="mt-3 p-3 bg-blue-500/10 rounded border border-blue-500/20">
                    <p className="text-blue-400 text-sm">
                      <strong>Suggestion:</strong> {bias.suggestion}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}