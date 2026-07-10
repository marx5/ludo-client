import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "@/lib/utils"

function Input({
  className,
  type,
  ...props
}) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900 px-4 py-2 text-base text-slate-950 dark:text-white transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-950 dark:text-white placeholder:text-slate-400 dark:placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:bg-white dark:focus-visible:bg-black/50 focus-visible:shadow-[0_0_10px_rgba(30,144,255,0.3)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-black/50 disabled:opacity-50 md:text-sm",
        className
      )}
      {...props} />
  );
}

export { Input }
