"use client";

/**
 * Page Politique de Confidentialité.
 * 
 * Requise par Google pour la publication de l'application OAuth.
 * Explique la collecte de données, l'utilisation de Google Calendar,
 * et les droits RGPD des utilisateurs.
 */

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { Shield, Lock, Eye, Database, Mail, Globe } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen overflow-hidden">
            <BackgroundDecorations />
            <Header />

            {/* Hero */}
            <section className="container mx-auto px-4 py-12 sm:py-16 text-center">
                <div className="mx-auto max-w-3xl space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
                        <Lock className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                        Politique de <span className="gradient-text">Confidentialité</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Dernière mise à jour : 21 janvier 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 pb-16">
                <div className="mx-auto max-w-3xl space-y-6">

                    {/* Introduction */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Eye className="w-5 h-5 text-primary" />
                            Introduction
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Chez <strong className="text-foreground">My Life Planner</strong>, nous accordons une importance
                            primordiale à la protection de vos données personnelles. Cette politique de confidentialité
                            explique quelles informations nous collectons, comment nous les utilisons et quels sont vos
                            droits concernant ces données.
                        </p>
                    </div>

                    {/* Data Collection */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Database className="w-5 h-5 text-blue-500" />
                            Données collectées
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">
                                Nous collectons les informations suivantes lorsque vous utilisez notre service :
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong className="text-foreground">Informations de compte</strong> : nom, adresse email, photo de profil (optionnel)</li>
                                <li><strong className="text-foreground">Données d&apos;authentification</strong> : mot de passe hashé, tokens de session</li>
                                <li><strong className="text-foreground">Données d&apos;utilisation</strong> : séances d&apos;entraînement, exercices, objectifs, pesées</li>
                                <li><strong className="text-foreground">Données de calendrier</strong> : si vous connectez Google Calendar, nous accédons uniquement aux événements que vous synchronisez avec My Life Planner</li>
                            </ul>
                        </div>
                    </div>

                    {/* Google Calendar */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Globe className="w-5 h-5 text-amber-500" />
                            Intégration Google Calendar
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">
                                My Life Planner utilise l&apos;API Google Calendar pour vous permettre de synchroniser vos
                                séances d&apos;entraînement avec votre calendrier Google. Voici ce que vous devez savoir :
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Nous demandons uniquement les permissions nécessaires pour créer et modifier des événements</li>
                                <li>Nous n&apos;accédons <strong className="text-foreground">jamais</strong> à vos autres événements de calendrier</li>
                                <li>Vous pouvez révoquer cet accès à tout moment depuis les paramètres de votre compte Google</li>
                                <li>Les tokens d&apos;accès sont stockés de manière sécurisée et chiffrée</li>
                            </ul>
                            <div className="mt-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <p className="text-sm text-primary">
                                    <strong>Conformité :</strong> Notre utilisation de l&apos;API Google est conforme aux{" "}
                                    <a
                                        href="https://developers.google.com/terms/api-services-user-data-policy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:opacity-80"
                                    >
                                        Règles relatives aux données utilisateur des services d&apos;API Google
                                    </a>.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Data Usage */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Utilisation des données
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">Nous utilisons vos données uniquement pour :</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Fournir et améliorer nos services</li>
                                <li>Personnaliser votre expérience utilisateur</li>
                                <li>Synchroniser vos séances avec votre calendrier (si vous l&apos;avez autorisé)</li>
                                <li>Vous envoyer des notifications importantes concernant votre compte</li>
                            </ul>
                            <p className="leading-relaxed mt-4">
                                <strong className="text-foreground">Nous ne vendons jamais vos données</strong> à des tiers
                                et ne les utilisons pas à des fins publicitaires.
                            </p>
                        </div>
                    </div>

                    {/* Data Storage */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Shield className="w-5 h-5 text-emerald-500" />
                            Stockage et sécurité
                        </h2>
                        <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                            <li>Vos données sont stockées sur des serveurs sécurisés (Railway, PostgreSQL)</li>
                            <li>Toutes les connexions sont chiffrées via HTTPS</li>
                            <li>Les mots de passe sont hashés avec bcrypt</li>
                            <li>Les tokens d&apos;authentification sont signés et ont une durée de vie limitée</li>
                        </ul>
                    </div>

                    {/* Your Rights */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Vos droits (RGPD)
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">
                                Conformément au RGPD, vous disposez des droits suivants :
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li><strong className="text-foreground">Accès</strong> : demander une copie de vos données</li>
                                <li><strong className="text-foreground">Rectification</strong> : corriger vos informations personnelles</li>
                                <li><strong className="text-foreground">Suppression</strong> : demander la suppression de votre compte et de vos données</li>
                                <li><strong className="text-foreground">Portabilité</strong> : exporter vos données dans un format standard</li>
                                <li><strong className="text-foreground">Opposition</strong> : vous opposer à certains traitements de vos données</li>
                            </ul>
                        </div>
                    </div>

                    {/* Contact */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Mail className="w-5 h-5 text-purple-500" />
                            Contact
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Pour toute question concernant cette politique de confidentialité ou pour exercer vos droits,
                            contactez-nous à : <a href="mailto:contact@mylifeplanner.space" className="text-primary hover:underline">contact@mylifeplanner.space</a>
                        </p>
                    </div>

                </div>
            </section>

            <Footer />
        </div>
    );
}
