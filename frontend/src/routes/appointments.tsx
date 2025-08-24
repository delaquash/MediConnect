import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/appointments')({
  component: Appointment,
})

function Appointment() {
  return <div>Hello "/appointment"!</div>
}
