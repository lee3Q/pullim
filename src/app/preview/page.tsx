import { notFound, redirect } from "next/navigation";

export default function PreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  redirect("/");
}
