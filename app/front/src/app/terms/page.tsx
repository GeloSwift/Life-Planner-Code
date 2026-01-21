"use client";

/**
 * Page Conditions d'Utilisation.
 * 
 * Requise par Google pour la publication de l'application OAuth.
 * Définit les règles d'utilisation du service, les responsabilités
 * des utilisateurs et les limitations de responsabilité.
 */

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BackgroundDecorations } from "@/components/layout/background-decorations";
import { FileText, AlertTriangle, Scale, UserCheck, Ban } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen overflow-hidden">
            <BackgroundDecorations />
            <Header />

            {/* Hero */}
            <section className="container mx-auto px-4 py-12 sm:py-16 text-center">
                <div className="mx-auto max-w-3xl space-y-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
                        <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
                        Conditions <span className="gradient-text">d&apos;Utilisation</span>
                    </h1>
                    <p className="text-muted-foreground">
                        Dernière mise à jour : 21 janvier 2026
                    </p>
                </div>
            </section>

            {/* Content */}
            <section className="container mx-auto px-4 pb-16">
                <div className="mx-auto max-w-3xl space-y-6">

                    {/* Acceptance */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Scale className="w-5 h-5 text-primary" />
                            Acceptation des conditions
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            En accédant à <strong className="text-foreground">My Life Planner</strong> (accessible via
                            mylifeplanner.space), vous acceptez d&apos;être lié par ces conditions d&apos;utilisation.
                            Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser notre service.
                        </p>
                    </div>

                    {/* Service Description */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Description du service
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">
                                My Life Planner est une application de planification de vie personnelle qui vous permet de :
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Planifier et suivre vos séances d&apos;entraînement</li>
                                <li>Créer et gérer des exercices personnalisés</li>
                                <li>Suivre votre progression (poids, objectifs)</li>
                                <li>Synchroniser vos séances avec Google Calendar</li>
                                <li>Exporter vos données au format ICS</li>
                            </ul>
                        </div>
                    </div>

                    {/* User Account */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <UserCheck className="w-5 h-5 text-emerald-500" />
                            Compte utilisateur
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">
                                Pour utiliser My Life Planner, vous devez créer un compte. Vous vous engagez à :
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Fournir des informations exactes et à jour</li>
                                <li>Protéger la confidentialité de votre mot de passe</li>
                                <li>Nous informer immédiatement de toute utilisation non autorisée de votre compte</li>
                                <li>Être seul responsable de toutes les activités effectuées sous votre compte</li>
                            </ul>
                        </div>
                    </div>

                    {/* Prohibited Uses */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <Ban className="w-5 h-5 text-red-500" />
                            Utilisations interdites
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">Il est interdit de :</p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Utiliser le service à des fins illégales</li>
                                <li>Tenter de compromettre la sécurité du service</li>
                                <li>Collecter des données d&apos;autres utilisateurs sans leur consentement</li>
                                <li>Utiliser des robots ou scripts automatisés pour accéder au service</li>
                                <li>Reproduire, dupliquer ou revendre une partie du service</li>
                            </ul>
                        </div>
                    </div>

                    {/* Intellectual Property */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Propriété intellectuelle
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Le contenu de My Life Planner (code, design, logos, textes) est protégé par les droits
                            d&apos;auteur. Vous conservez tous les droits sur les données que vous créez dans
                            l&apos;application (exercices personnalisés, séances, notes).
                        </p>
                    </div>

                    {/* Health Disclaimer */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            Avertissement santé
                        </h2>
                        <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
                            <p className="text-amber-600 dark:text-amber-400 leading-relaxed">
                                <strong>Important :</strong> My Life Planner est un outil de planification et de suivi.
                                Il ne remplace pas les conseils d&apos;un professionnel de santé. Consultez un médecin
                                avant de commencer tout programme d&apos;exercice, surtout si vous avez des conditions
                                médicales préexistantes.
                            </p>
                        </div>
                    </div>

                    {/* Liability */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Limitation de responsabilité
                        </h2>
                        <div className="space-y-4 text-muted-foreground">
                            <p className="leading-relaxed">
                                Le service est fourni &quot;tel quel&quot;. Nous ne garantissons pas que le service sera
                                disponible de manière ininterrompue ou sans erreur. Dans la mesure permise par la loi,
                                nous déclinons toute responsabilité pour :
                            </p>
                            <ul className="list-disc list-inside space-y-2 ml-4">
                                <li>Les pertes de données dues à des problèmes techniques</li>
                                <li>Les dommages indirects liés à l&apos;utilisation du service</li>
                                <li>Les blessures résultant de l&apos;exécution d&apos;exercices planifiés via l&apos;application</li>
                            </ul>
                        </div>
                    </div>

                    {/* Modifications */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Modifications des conditions
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
                            prendront effet dès leur publication sur cette page. Nous vous encourageons à consulter
                            régulièrement cette page. Votre utilisation continue du service après la publication des
                            modifications constitue votre acceptation de ces changements.
                        </p>
                    </div>

                    {/* Account Termination */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Résiliation
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Vous pouvez supprimer votre compte à tout moment depuis les paramètres de votre profil.
                            Nous nous réservons le droit de suspendre ou supprimer votre compte en cas de violation
                            de ces conditions d&apos;utilisation.
                        </p>
                    </div>

                    {/* Governing Law */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Droit applicable
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Ces conditions sont régies par le droit français. Tout litige relatif à ces conditions
                            sera soumis à la compétence exclusive des tribunaux français.
                        </p>
                    </div>

                    {/* Contact */}
                    <div className="rounded-2xl border bg-card p-6 md:p-8">
                        <h2 className="text-xl font-semibold mb-4">
                            Contact
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Pour toute question concernant ces conditions d&apos;utilisation, contactez-nous à :{" "}
                            <a href="mailto:contact@mylifeplanner.space" className="text-primary hover:underline">
                                contact@mylifeplanner.space
                            </a>
                        </p>
                    </div>

                </div>
            </section>

            <Footer />
        </div>
    );
}
