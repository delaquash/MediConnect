import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/doctors/myprofile')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/doctors/myprofile"!</div>
}
