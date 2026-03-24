import { ProjectWizard } from "@/components/project-wizard";

export default function NewProjectPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create Project</h1>
        <p className="text-muted-foreground">
          Set up a new growth intelligence project
        </p>
      </div>
      <ProjectWizard />
    </div>
  );
}

