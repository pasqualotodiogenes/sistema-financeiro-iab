"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  backHref?: string;
  children?: ReactNode;
}

export function PageHeader({ title, description, icon, backHref, children }: PageHeaderProps) {
  return (
    <div className="bg-white border-b border-cream-200 px-4 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          {backHref && (
            <Link href={backHref}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-lg text-primary-700"
                title="Voltar"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
          )}
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-primary-800">{title}</h1>
              {description && <p className="text-primary-600">{description}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {children}
        </div>
      </div>
    </div>
  );
}