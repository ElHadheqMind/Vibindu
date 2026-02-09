
export const translations = {
    fr: {
        COMMON: {
            Gsrsm_EDITOR: 'Éditeur GSRSM',
            ABOUT_Gsrsm: 'À propos du GSRSM',
            EXPORT_PDF: 'Exporter en PDF',
            MODES: 'modes',
            Gsrsm_DIAGRAM: 'Diagramme GSRSM',
            ABOUT_TEXT: "GSRSM (Guide d'Étude des Modes de Marches et d'Arrêts / Guide for the Study of Run and Stop Modes) est une méthodologie pour la conception des systèmes automatisés. Elle définit trois familles d'états: F (Procédures de Fonctionnement), A (Procédures d'Arrêt), et D (Procédures de Défaillance).",
            Gsrsm_SUBTITLE: "Guide d'Étude des Modes de Marches et d'Arrêts",
            LOADING: 'Chargement de l\'éditeur...',
            G7_MODE: 'Mode GRAFCET',
            Gsrsm_MODE: 'Mode GSRSM',
            DARK_MODE: 'Mode Sombre',
            LIGHT_MODE: 'Mode Clair',
            RESET_APP: 'Réinitialiser l\'App',
            SIGN_OUT: 'Déconnexion',
            USER: 'Utilisateur',
            EXPLORER: 'Explorateur',
            NEW_FILE: 'Nouveau Fichier',
            REFRESH: 'Actualiser',
            NO_FILES: 'Aucun fichier à afficher',
            OPEN_PROJECT_START: 'Ouvrez un projet pour commencer',
        },
        Gsrsm: {
            LABELS: {
                DEMANDES_MARCHE: "Demandes de marche",
                DEMANDES_ARRET: "Demandes d'arrêt",
                DETECTION_DEFAILLANCE: "Détection défaillance",
                PRODUCTION: "Production",
                EQUIPMENT_REF: "Référence de l'équipement:"
            },
            SECTIONS: {
                A: "Procédures d'Arrêt",
                F: "Procédures de Fonctionnement",
                D: "Procédures de Défaillance"
            },
            MODES: {
                A1: {
                    TITLE: "Arrêt dans état initial",
                    DESC: "C'est l'état repos de la machine. Il correspond en général à la situation initiale du grafcet."
                },
                A2: {
                    TITLE: "Arrêt demandé en fin de cycle",
                    DESC: "Lorsque l'arrêt est demandé, la machine continue de produire jusqu'à la fin de cycle; l'état A2 est donc un état transitoire vers l'état A1"
                },
                A3: {
                    TITLE: "Arrêt demandé dans état déterminé",
                    DESC: "La machine continue de produire jusqu'à un arrêt en une position autre que la fin de cycle; c'est un état transitoire vers A4"
                },
                A4: {
                    TITLE: "Arrêt Obtenu",
                    DESC: "La machine est alors arrêté dans un état autre que la fin de cycle."
                },
                A5: {
                    TITLE: "Préparation pour remise en route après défaillance",
                    DESC: "C'est dans cet état que l'on procède à toutes les opérations (désengagements, nettoyages ...) nécessaires à une remise en route après défaillance"
                },
                A6: {
                    TITLE: "Mise PO dans état initial",
                    DESC: "La machine étant en A6, on remet manuellement ou automatiquement la partie opérative en position initiale pour un redémarrage dans l'état initial."
                },
                A7: {
                    TITLE: "Mise PO dans état déterminé",
                    DESC: "La machine étant en A7, on remet la partie opérative en position pour un redémarrage dans une position autre que l'état initial."
                },
                F1: {
                    TITLE: "Production normale",
                    DESC: "Dans cet état la machine produit normalement : c'est l'état pour pour lequel elle a été conçue. On peut souvent faire correspondre à cet état un grafcet que l'on appelle 'grafcet de base'."
                },
                F2: {
                    TITLE: "Marche de préparation",
                    DESC: "Cet état est utilisé pour les machines nécessitant une préparation préalable à la production normale : Préchauffage de l'outillage, remplissage, mises en routes diverses ..."
                },
                F3: {
                    TITLE: "Marche de clôture",
                    DESC: "C'est l'état nécessaire pour certaines machines devant être vidées, nettoyées ... en fin de journée ou en fin de série."
                },
                F4: {
                    TITLE: "Marches de vérification dans le désordre",
                    DESC: "Cette état permet de vérifier certaines fonction ou certains mouvement sur la machine sans respecter l'ordre de déroulement du cycle."
                },
                F5: {
                    TITLE: "Marches de vérification dans l'ordre",
                    DESC: "Dans cet état, le cycle de production peut être exploré au rythme de production voulu par la personne effectuant la vérification"
                },
                F6: {
                    TITLE: "Marches de test",
                    DESC: "Les machines de contrôle, de tri, de mesure... comportent des capteurs qui doivent être réglés ou étalonnés : cet état permet les différentes opérations."
                },
                D1: {
                    TITLE: "Arrêt d'urgence",
                    DESC: "C'est l'état pris lors d'un arrêt d'urgence : on y prévoit non seulement les arrêts, mais aussi les cycles de dégagement, les procédures et précautions nécessaires pour éviter ou limiter les conséquences dues à la défaillance."
                },
                D2: {
                    TITLE: "Diagnostic et/ou traitement de la défaillance",
                    DESC: "C'est dans cet état que la machine peut être examinée après défaillance et qu'il peut être apporté un traitement permettant le redémarrage."
                },
                D3: {
                    TITLE: "Production tout de même",
                    DESC: "Il est parfois nécessaire de continuer la production même après une défaillance de la machine : on aura alors une production dégradée, forcée ou aidée par des opérateurs non prévus en production normale."
                }
            }
        }
    },
    en: {
        COMMON: {
            Gsrsm_EDITOR: 'GSRSM Editor',
            ABOUT_Gsrsm: 'About GSRSM',
            EXPORT_PDF: 'Export to PDF',
            MODES: 'modes',
            Gsrsm_DIAGRAM: 'GSRSM Diagram',
            ABOUT_TEXT: "GSRSM (Guide for the Study of Run and Stop Modes / Guide d'Étude des Modes de Marches et d'Arrêts) is a guide for the study of operation and stop modes. It defines three families of states: F (Operating Procedures), A (Stop Procedures), and D (Failure Procedures).",
            Gsrsm_SUBTITLE: "Guide for the Study of Run and Stop Modes",
            LOADING: 'Loading Editor...',
            G7_MODE: 'GRAFCET Mode',
            Gsrsm_MODE: 'GSRSM Mode',
            DARK_MODE: 'Dark Mode',
            LIGHT_MODE: 'Light Mode',
            RESET_APP: 'Reset App',
            SIGN_OUT: 'Sign Out',
            USER: 'User',
            EXPLORER: 'Explorer',
            NEW_FILE: 'New File',
            REFRESH: 'Refresh',
            NO_FILES: 'No files to display',
            OPEN_PROJECT_START: 'Open a project to get started',
        },
        Gsrsm: {
            LABELS: {
                DEMANDES_MARCHE: "Operation requests",
                DEMANDES_ARRET: "Stop requests",
                DETECTION_DEFAILLANCE: "Failure detection",
                PRODUCTION: "Production",
                EQUIPMENT_REF: "Equipment reference:"
            },
            SECTIONS: {
                A: "Stop Procedures",
                F: "Operating Procedures",
                D: "Failure Procedures"
            },
            MODES: {
                A1: {
                    TITLE: "Stopped in initial state",
                    DESC: "This is the machine's rest state. generally corresponding to the initial situation of the grafcet."
                },
                A2: {
                    TITLE: "Requested stop at end of cycle",
                    DESC: "When the stop is requested, the machine continues to produce until the end of the cycle; state A2 is, therefore, a transient state towards state A1."
                },
                A3: {
                    TITLE: "Requested stop in determined state",
                    DESC: "The machine continues to produce until it stops in a position other than the end of the cycle; it is a transient state towards A4."
                },
                A4: {
                    TITLE: "Stopped state obtained",
                    DESC: "The machine is then stopped in a state other than the end of the cycle."
                },
                A5: {
                    TITLE: "Preparation for return to operation after failure",
                    DESC: "It is in this state that all operations (clearing, cleaning...) necessary for a restart after failure are carried out."
                },
                A6: {
                    TITLE: "Putting OP in initial state",
                    DESC: "The machine being in A6, the operative part is manually or automatically returned to the initial position for a restart in the initial state."
                },
                A7: {
                    TITLE: "Putting OP in determined state",
                    DESC: "The machine being in A7, the operative part is returned to position for a restart in a position other than the initial state."
                },
                F1: {
                    TITLE: "Normal production",
                    DESC: "In this state, the machine produces normally: this is the state for which it was designed. This state often corresponds to a grafcet called the 'base grafcet'."
                },
                F2: {
                    TITLE: "Preparation mode",
                    DESC: "This state is used for machines requiring preparation prior to normal production: preheating tooling, filling, various start-ups..."
                },
                F3: {
                    TITLE: "Closing mode",
                    DESC: "This is the state necessary for certain machines that must be emptied, cleaned... at the end of the day or at the end of the series."
                },
                F4: {
                    TITLE: "Verification mode (unordered)",
                    DESC: "This state allows certain functions or movements on the machine to be checked without respecting the cycle order."
                },
                F5: {
                    TITLE: "Verification mode (ordered)",
                    DESC: "In this state, the production cycle can be explored at the production rate desired by the person performing the check."
                },
                F6: {
                    TITLE: "Testing mode",
                    DESC: "Control, sorting, measuring machines... contain sensors that must be adjusted or calibrated: this state allows the various operations."
                },
                D1: {
                    TITLE: "Emergency stop",
                    DESC: "This is the state taken during an emergency stop: it provides not only for stops but also for clearing cycles, procedures, and precautions necessary to avoid or limit the consequences due to the failure."
                },
                D2: {
                    TITLE: "Diagnosis and/or failure treatment",
                    DESC: "It is in this state that the machine can be examined after failure and a treatment allowing restart can be provided."
                },
                D3: {
                    TITLE: "Production despite failure",
                    DESC: "It is sometimes necessary to continue production even after a machine failure: there will then be a degraded production, forced or assisted by operators not provided for in normal production."
                }
            }
        }
    }
};
