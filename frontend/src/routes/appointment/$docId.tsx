import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/appointment/$docId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/appointment/$docId"!</div>
}
