import { LoginForm } from "@/components/LoginForm";

interface LoginPageProps {
  searchParams: Promise<{ next?: string | string[] }>;
}

function getSafeNextPath(value: string | string[] | undefined): string {
  if (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.startsWith("/login")
  ) {
    return value;
  }
  return "/paddleocr";
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-intro">
          <span className="eyebrow">
            <span className="material-symbols-outlined text-base" aria-hidden="true">lock</span>
            Private workbench
          </span>
          <h1 id="login-title" className="login-title">Your OCR desk is ready.</h1>
          <p className="login-copy">
            Unlock the shared workspace, add a document image, and shape the result into an Excel-ready table.
          </p>
          <ol className="flow-list" aria-label="Workspace flow">
            <li><span className="flow-number">01</span> Add or paste an image</li>
            <li><span className="flow-number">02</span> Review the extracted fields</li>
            <li><span className="flow-number">03</span> Copy or export the table</li>
          </ol>
        </div>
        <div className="login-form-panel">
          <span className="eyebrow">Workspace access</span>
          <h2 className="mt-5 font-headline-md text-headline-md font-bold text-on-surface">Unlock VisionExtract</h2>
          <p className="mb-7 mt-2 font-body-sm text-body-sm leading-6 text-on-surface-variant">
            The password stays on the server and grants access to every OCR tool in this workspace.
          </p>
          <LoginForm nextPath={getSafeNextPath(next)} />
        </div>
      </section>
    </main>
  );
}
