import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/myappointment')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/myappointment"!</div>
}
