"use client";;
import { forwardRef } from "react";

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const TooltipIconButton = forwardRef(({ children, tooltip, side = "bottom", className, ...rest }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          {...rest}
          className={cn("aui-button-icon", className)}
          ref={ref}>
          {children}
          <span className="aui-sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  );
});

TooltipIconButton.displayName = "TooltipIconButton";
