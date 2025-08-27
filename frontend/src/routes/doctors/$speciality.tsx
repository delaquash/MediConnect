import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/doctors/$speciality')({
  component: Speciality,
})

function Speciality() {
  return <div>Hello "/doctors/$speciality"!</div>
}
