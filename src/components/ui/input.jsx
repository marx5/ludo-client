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
        "h-11 w-full min-w-0 rounded-xl border border-white/10 bg-black/30 backdrop-blur-md px-4 py-2 text-base text-white transition-all outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-white placeholder:text-gray-400 focus-visible:border-blue-500 focus-visible:bg-black/50 focus-visible:shadow-[0_0_10px_rgba(30,144,255,0.3)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-black/50 disabled:opacity-50 md:text-sm",
        className
      )}
      {...props} />
  );
}

export { Input }
