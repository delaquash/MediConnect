import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/doctors/$speciality')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/doctors/$speciality"!</div>
}
