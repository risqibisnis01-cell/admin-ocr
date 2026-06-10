<!DOCTYPE html><html lang="en" style=""><head>
<meta charset="utf-8">
<meta content="width=device-width, initial-scale=1.0" name="viewport">
<title>VisionExtract - OCR Workspace</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect">
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect">
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&amp;family=Inter:wght@400;500;600&amp;family=JetBrains+Mono:wght@500&amp;display=swap" rel="stylesheet">
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet">
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Config -->
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                    "error": "#ba1a1a",
                    "surface-tint": "#4d44e3",
                    "surface-dim": "#d8dadc",
                    "on-tertiary": "#ffffff",
                    "on-surface": "#191c1e",
                    "on-surface-variant": "#464555",
                    "outline": "#777587",
                    "surface-container-lowest": "#ffffff",
                    "on-primary-fixed-variant": "#3323cc",
                    "secondary-fixed": "#dae2fd",
                    "tertiary-container": "#a44100",
                    "surface-container-highest": "#e0e3e5",
                    "secondary-container": "#dae2fd",
                    "on-secondary-fixed": "#131b2e",
                    "error-container": "#ffdad6",
                    "on-background": "#191c1e",
                    "inverse-surface": "#2d3133",
                    "on-secondary-container": "#5c647a",
                    "on-tertiary-fixed-variant": "#7b2f00",
                    "secondary": "#565e74",
                    "surface": "#f7f9fb",
                    "on-tertiary-fixed": "#351000",
                    "on-error-container": "#93000a",
                    "primary-container": "#4f46e5",
                    "surface-container-high": "#e6e8ea",
                    "surface-bright": "#f7f9fb",
                    "surface-container": "#eceef0",
                    "on-primary-fixed": "#0f0069",
                    "tertiary": "#7e3000",
                    "surface-container-low": "#f2f4f6",
                    "on-tertiary-container": "#ffd2be",
                    "outline-variant": "#c7c4d8",
                    "inverse-primary": "#c3c0ff",
                    "surface-variant": "#e0e3e5",
                    "tertiary-fixed": "#ffdbcc",
                    "primary-fixed-dim": "#c3c0ff",
                    "inverse-on-surface": "#eff1f3",
                    "primary-fixed": "#e2dfff",
                    "on-primary": "#ffffff",
                    "secondary-fixed-dim": "#bec6e0",
                    "on-primary-container": "#dad7ff",
                    "on-error": "#ffffff",
                    "tertiary-fixed-dim": "#ffb695",
                    "primary": "#3525cd",
                    "on-secondary": "#ffffff",
                    "background": "#f7f9fb",
                    "on-secondary-fixed-variant": "#3f465c"
            },
            "borderRadius": {
                    "DEFAULT": "0.25rem",
                    "lg": "0.5rem",
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "stack-lg": "48px",
                    "margin-desktop": "40px",
                    "gutter": "24px",
                    "stack-sm": "12px",
                    "base": "8px",
                    "margin-mobile": "16px",
                    "container-max": "1280px",
                    "stack-md": "24px"
            },
            "fontFamily": {
                    "body-lg": ["Inter"],
                    "body-sm": ["Inter"],
                    "display-lg": ["Hanken Grotesk"],
                    "headline-lg-mobile": ["Hanken Grotesk"],
                    "label-code": ["JetBrains Mono"],
                    "headline-sm": ["Hanken Grotesk"],
                    "headline-md": ["Hanken Grotesk"],
                    "body-md": ["Inter"],
                    "headline-lg": ["Hanken Grotesk"]
            },
            "fontSize": {
                    "body-lg": ["18px", {"lineHeight": "28px", "fontWeight": "400"}],
                    "body-sm": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                    "display-lg": ["48px", {"lineHeight": "56px", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                    "headline-lg-mobile": ["28px", {"lineHeight": "36px", "fontWeight": "600"}],
                    "label-code": ["13px", {"lineHeight": "16px", "fontWeight": "500"}],
                    "headline-sm": ["20px", {"lineHeight": "28px", "fontWeight": "600"}],
                    "headline-md": ["24px", {"lineHeight": "32px", "fontWeight": "600"}],
                    "body-md": ["16px", {"lineHeight": "24px", "fontWeight": "400"}],
                    "headline-lg": ["32px", {"lineHeight": "40px", "letterSpacing": "-0.01em", "fontWeight": "600"}]
            }
          }
        }
      }
    </script>
<style>
        body {
            background-color: theme('colors.background');
            color: theme('colors.on-background');
        }
    </style>
</head>
<body class="min-h-screen flex flex-col font-body-md text-body-md">
<!-- TopNavBar -->
<header class="bg-surface dark:bg-on-surface text-primary dark:text-primary-fixed font-body-md text-body-md docked full-width top-0 border-b border-outline-variant dark:border-outline flat no shadows sticky z-50">
<div class="flex justify-between items-center w-full px-margin-desktop max-w-container-max mx-auto h-16">
<div class="flex items-center gap-6 flex-grow">
<!-- Brand Logo -->
<div class="flex items-center gap-2 font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed cursor-pointer">
<span class="material-symbols-outlined text-3xl" data-weight="fill" style="font-variation-settings: 'FILL' 1;">document_scanner</span>
                    VisionExtract
                </div>
<!-- Navigation Links (Desktop) -->
<nav class="hidden md:flex gap-6 mt-2 h-full items-end ml-auto">
<!-- Active Tab -->
<a class="text-primary dark:text-primary-fixed border-b-2 border-primary dark:border-primary-fixed pb-2 font-semibold hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">
                        PaddleOCR
                    </a>
<!-- Inactive Tabs -->
<a class="text-on-surface-variant dark:text-surface-variant pb-2 hover:text-primary dark:hover:text-primary-fixed-dim transition-colors" href="#">
                        Tesseract
                    </a>

</nav>
</div>
<!-- Trailing Icons -->

</div>
</header>
<!-- Main Workspace -->
<main class="flex-grow w-full px-margin-mobile md:px-margin-desktop py-stack-lg max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-12 gap-gutter">
<!-- Left Column: Upload / Drop Zone (5 columns) -->
<section class="md:col-span-5 flex flex-col h-full">
<div class="border-2 border-dashed border-primary/30 rounded-xl bg-surface-container-lowest hover:bg-primary/5 transition-all duration-300 flex flex-col items-center justify-center p-8 text-center min-h-[360px] cursor-pointer group shadow-sm hover:shadow-md" id="drop-zone">
<div class="bg-surface-container p-4 rounded-full mb-4 group-hover:scale-110 transition-transform duration-300">
<span class="material-symbols-outlined text-4xl text-primary" data-icon="image">image</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-on-surface mb-2">Drop image here or click to upload</h3>
<p class="font-body-sm text-body-sm text-on-surface-variant mb-6">Supports PNG, JPG, JPEG, WEBP</p>
<div class="inline-flex items-center gap-2 text-primary bg-primary/10 px-4 py-2 rounded-full font-body-sm text-body-sm font-medium">
<span class="material-symbols-outlined text-sm" data-icon="content_paste">content_paste</span>
                    Press Ctrl+V to paste screenshot
                </div>
</div>
<!-- Empty state illustration hint below drop zone -->
<div class="mt-auto pt-stack-md flex flex-col items-center justify-center opacity-60">
<span class="material-symbols-outlined text-3xl text-outline mb-2" data-icon="assignment">assignment</span>
<p class="font-body-sm text-body-sm text-on-surface-variant">Upload or paste an image to start OCR</p>
</div>
</section>
<!-- Right Column: Results Panel (7 columns) -->
<section class="md:col-span-7 flex flex-col h-full">
<div class="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_10px_15px_-3px_rgba(0,0,0,0.02)] flex flex-col min-h-[460px] overflow-hidden">
<!-- Results Header -->
<div class="px-6 py-4 border-b border-outline-variant/50 bg-surface-bright flex justify-between items-center">
<h2 class="font-headline-sm text-headline-sm text-on-surface">Results</h2>
<div class="flex items-center gap-2">
<span class="w-2 h-2 rounded-full bg-outline-variant"></span>
<span class="font-body-sm text-body-sm text-on-surface-variant">Idle</span>
</div>
</div>
<!-- Results Canvas (Empty State) -->
<div class="flex-grow p-6 flex flex-col items-center justify-center bg-surface-container-lowest text-on-surface-variant relative">
<p class="font-body-md text-body-md">No OCR results yet</p>
</div>
<!-- Action Bar (Footer of Results Card) -->
<div class="px-6 py-4 bg-surface-bright border-t border-outline-variant/50 flex flex-wrap gap-3 items-center">
<button class="bg-primary text-on-primary font-body-sm text-body-sm font-semibold px-4 py-2 rounded-lg hover:bg-primary-container hover:text-on-primary-container transition-colors shadow-sm flex items-center gap-2 opacity-50 cursor-not-allowed" disabled="">
<span class="material-symbols-outlined text-sm" data-icon="table_view">table_view</span>
                        Copy to Excel
                    </button>
<button class="border border-outline bg-transparent text-on-surface font-body-sm text-body-sm font-medium px-4 py-2 rounded-lg hover:bg-surface-container transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed" disabled="">
<span class="material-symbols-outlined text-sm" data-icon="download">download</span>
                        Export CSV
                    </button>
<button class="ml-auto text-error hover:bg-error-container hover:text-on-error-container font-body-sm text-body-sm font-medium px-4 py-2 rounded-lg transition-colors flex items-center gap-2 opacity-50 cursor-not-allowed" disabled="">
<span class="material-symbols-outlined text-sm" data-icon="delete">delete</span>
                        Clear
                    </button>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-low dark:bg-inverse-surface text-primary dark:text-primary-fixed font-body-sm text-body-sm full-width bottom-0 border-t border-outline-variant dark:border-outline flat no shadows mt-auto">
<div class="flex flex-col md:flex-row justify-between items-center w-full py-stack-md px-margin-desktop max-w-container-max mx-auto gap-stack-sm">
<div class="font-headline-sm text-headline-sm font-bold text-on-surface dark:text-inverse-on-surface">
                VisionExtract
            </div>
<div class="text-on-surface-variant dark:text-surface-variant text-center md:text-left">
                © 2024 VisionExtract. Professional Grade OCR Tools.
            </div>
<div class="flex gap-4">
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors inline-block transition-transform hover:translate-y-[-1px]" href="#">
                    Documentation
                </a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors inline-block transition-transform hover:translate-y-[-1px]" href="#">
                    Privacy Policy
                </a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors inline-block transition-transform hover:translate-y-[-1px]" href="#">
                    Terms of Service
                </a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary dark:hover:text-primary-fixed transition-colors inline-block transition-transform hover:translate-y-[-1px]" href="#">
                    Support
                </a>
</div>
</div>
</footer>
<script>
        // Simple drag and drop visual feedback script
        const dropZone = document.getElementById('drop-zone');

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, highlight, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, unhighlight, false);
        });

        function highlight(e) {
            dropZone.classList.add('bg-primary/10');
            dropZone.classList.add('border-primary');
            dropZone.classList.remove('border-primary/30');
        }

        function unhighlight(e) {
            dropZone.classList.remove('bg-primary/10');
            dropZone.classList.remove('border-primary');
            dropZone.classList.add('border-primary/30');
        }
    </script>

</body></html>
