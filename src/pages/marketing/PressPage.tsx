import React from 'react';
import { motion } from 'motion/react';
import { Download, Mail, Palette, Type } from 'lucide-react';
import { TrussenAppLogo } from '@/assets/svg/TrussenAppLogo';
import { MarketingLayout, PageHero, Section, SectionHeading, fadeUp } from './shared';

const PRESS_EMAIL = 'press@trussen.app';

const facts = [
  { label: 'Company', value: 'Trussen Inc.' },
  { label: 'Founded', value: '2026' },
  { label: 'Headquarters', value: 'Remote-first' },
  { label: 'Category', value: 'Project management software' },
  { label: 'Stage', value: 'Public beta' },
  { label: 'Website', value: 'trussen.app' },
];

const boilerplate = `Trussen is a project management workspace for software teams. It brings issues, projects, cycles and roadmaps into a single fast, keyboard-driven interface, with an AI assistant that handles the tedious parts of planning. Trussen is remote-first and self-funded, and has been in public beta since 2026.`;

const brandColors = [
  { name: 'Primary', hex: '#5F72EA', className: 'bg-primary' },
  { name: 'Dark surface', hex: '#0F1115', className: 'bg-[#0F1115]' },
  { name: 'Card', hex: '#1C1F2B', className: 'bg-[#1C1F2B]' },
  { name: 'Border', hex: '#2A2F3A', className: 'bg-[#2A2F3A]' },
];

export const PressPage: React.FC = () => (
  <MarketingLayout>
    <PageHero
      eyebrow="Press"
      title="Press &"
      titleAccent="brand kit."
      subtitle="Everything you need to write about Trussen accurately — facts, boilerplate, logos and colours."
    />

    {/* ─── Quick facts ─── */}
    <Section className="pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-gray-200 dark:border-border-dark bg-white dark:bg-card-dark overflow-hidden"
        >
          {facts.map((f, i) => (
            <div
              key={f.label}
              className={`flex items-center justify-between px-6 py-4 ${
                i !== 0 ? 'border-t border-gray-100 dark:border-border-dark/60' : ''
              }`}
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">{f.label}</span>
              <span className="text-sm font-semibold">{f.value}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </Section>

    {/* ─── Boilerplate ─── */}
    <Section className="pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeading eyebrow="Boilerplate" title="About Trussen, in one paragraph." />
        <motion.div
          variants={fadeUp}
          className="p-8 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-border-dark"
        >
          <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{boilerplate}</p>
          <button
            onClick={() => navigator.clipboard?.writeText(boilerplate)}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-border-dark hover:border-primary/40 transition-all"
          >
            Copy to clipboard
          </button>
        </motion.div>
      </div>
    </Section>

    {/* ─── Brand assets ─── */}
    <Section className="pb-16">
      <div className="max-w-4xl mx-auto px-4">
        <SectionHeading eyebrow="Assets" title="Logo & colours." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          <motion.div
            variants={fadeUp}
            className="p-10 rounded-2xl bg-white border border-gray-200 dark:border-border-dark flex flex-col items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2.5">
              <TrussenAppLogo className="w-12 h-12 shrink-0" />
              <span className="text-xl font-bold tracking-tight text-gray-900">Trussen</span>
            </div>
            <span className="text-xs text-gray-400">On light backgrounds</span>
          </motion.div>

          <motion.div
            variants={fadeUp}
            custom={1}
            className="p-10 rounded-2xl bg-[#0F1115] border border-gray-200 dark:border-border-dark flex flex-col items-center justify-center gap-4"
          >
            <div className="flex items-center gap-2.5">
              <TrussenAppLogo className="w-12 h-12 shrink-0" />
              <span className="text-xl font-bold tracking-tight text-white">Trussen</span>
            </div>
            <span className="text-xs text-gray-500">On dark backgrounds</span>
          </motion.div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {brandColors.map((c, i) => (
            <motion.div
              key={c.hex}
              variants={fadeUp}
              custom={i}
              className="rounded-2xl border border-gray-200 dark:border-border-dark overflow-hidden"
            >
              <div className={`h-20 ${c.className}`} />
              <div className="p-3 bg-white dark:bg-card-dark">
                <div className="text-xs font-bold">{c.name}</div>
                <div className="text-[11px] text-gray-400 mt-0.5">{c.hex}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Type size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Typeface</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Inter, across the product and all brand material.
              </p>
            </div>
          </div>
          <div className="p-5 rounded-2xl bg-white dark:bg-card-dark border border-gray-200 dark:border-border-dark flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Palette size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm mb-1">Usage</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Don't recolour, rotate or add effects to the mark. Keep clear space around it.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>

    {/* ─── Contact ─── */}
    <Section className="pb-24">
      <div className="max-w-4xl mx-auto px-4">
        <motion.div
          variants={fadeUp}
          className="p-8 sm:p-10 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-border-dark text-center"
        >
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-5">
            <Download size={20} />
          </div>
          <h3 className="text-xl font-bold mb-2">Need something else?</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-lg mx-auto mb-6 leading-relaxed">
            High-resolution logo files, product screenshots, founder headshots or an interview —
            email us and we'll send it over the same day.
          </p>
          <a
            href={`mailto:${PRESS_EMAIL}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
          >
            <Mail size={16} />
            {PRESS_EMAIL}
          </a>
        </motion.div>
      </div>
    </Section>
  </MarketingLayout>
);
