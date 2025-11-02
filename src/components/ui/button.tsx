import * as React from 'react'
export function Button({className='', ...props}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={'inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm ' + className} {...props} />
}
export default Button
