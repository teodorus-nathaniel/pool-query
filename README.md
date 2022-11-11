# pool-query

A package that provides function to pool multiple queries that are run in certain intervals into one call, and distributes the result back into those functions.

# Installation

```
npm i pool-query
# or
yarn add pool-query
```

# Usage

```
import poolQuery from 'pool-query'

type Param = { queryKey: [string, string] } // param types
type Result = { id: string, name: string } // awaited response types
const pooledFunction = poolQuery<Param, Result>({
  singleCall: (param) => fetch('URL TO FETCH', { id: param.id }).then(data => data.json())
  multiCall: (params) => fetch('URL TO FETCH (for multiple ids)', { ids: params.map(({ id }) => id) }).then(data => data.json())
})

function main() {
  const data5 = await pooledFunction({ id: '5' })
  const data10 = await pooledFunction({ id: '10' })
  const data15 = await pooledFunction({ id: '15' })

  console.log({ data5, data10, data15 })
  // all data are distributed, but it only results in 1 fetch call (the `multiCall` function)
}
main()
```

## Integration with react-query

```
// App.tsx
export default function App() {
  return (
    <>
      <Pokemon name='arceus' />
      <Pokemon name='dialga' />
      <Pokemon name='palkia' />
    </>
  )
}

// Pokemon.tsx
import { useQuery } from '@tanstack/react-query'
import poolQuery from 'pool-query'

const getPokemon = poolQuery<{ queryKey: [string, string] }, { name: string }>({
  singleCall: (param) =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${param}`).then((data) =>
      data.json()
    ),
  multiCall: (params) =>
    fetch(`https://pokeapi.co/api/v2/pokemon?limit=${params.length}`).then(
      (data) => data.json().then((data) => data.results)
    ),
})

export default function Pokemon({ name }: { name: string }) {
  const { data } = useQuery(['pokemon', name], getPokemon)
  console.log(data)

  return <div>{JSON.stringify(data)}</div>
}
```
