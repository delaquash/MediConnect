import { createFileRoute, useParams } from '@tanstack/react-router';


export const Route = createFileRoute('/doctors/$speciality')({
  component: Speciality,
})

function Speciality() {
  // const params = useParams();

  const { speciality } = useParams({ from: '/doctors/$speciality' })
    // const speciality = params.speciality;
  return <div>Hello... {speciality}"!</div>
}
