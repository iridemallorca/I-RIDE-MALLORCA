import * as React from 'react'
export function Card({className='', ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={'bg-white border rounded-2xl shadow ' + className} {...props} />
}
export function CardHeader({className='', ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={'p-4 border-b ' + className} {...props} />
}
export function CardTitle({className='', ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <h4 className={'font-bold ' + className} {...props} />
}
export function CardContent({className='', ...props}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={'p-4 ' + className} {...props} />
}
export default Card
