"use client";

import { BarChart3, LayoutDashboard, PieChart, TrendingUp, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const widgets = [
  {
    title: "Visitors by Device",
    description: "See how renters and buyers browse listings across mobile, tablet, and desktop.",
    tags: ["#Audience Insights", "#Performance"],
    icon: Users,
  },
  {
    title: "Dashboard Overview",
    description: "A high-level snapshot of your key housing metrics and activity trends.",
    tags: ["#Overview", "#Performance"],
    icon: LayoutDashboard,
  },
  {
    title: "Tour Performance",
    description: "Track tour request volume, approval rates, and conversion over time.",
    tags: ["#Performance", "#Trends"],
    icon: TrendingUp,
  },
  {
    title: "Trend Analysis",
    description: "Visualize listing views, bookings, and message activity across periods.",
    tags: ["#Trends", "#Analytics"],
    icon: BarChart3,
  },
  {
    title: "Customer Segmentation",
    description: "Break down your audience by renters, buyers, landlords, and agents.",
    tags: ["#Audience Insights", "#Segmentation"],
    icon: PieChart,
  },
];

type AddWidgetModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddWidgetModal({ open, onOpenChange }: AddWidgetModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="font-display text-xl">Add Widget</DialogTitle>
          <DialogDescription>Choose a widget to add to your dashboard layout.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
          {widgets.map((widget) => (
            <div
              key={widget.title}
              className="flex items-start gap-4 rounded-2xl border border-border/60 p-4 hover:border-primary/30 hover:bg-muted/20 transition"
            >
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-muted">
                <widget.icon size={22} className="text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">{widget.title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{widget.description}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {widget.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-md text-[10px] font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button size="sm" className="shrink-0 rounded-xl" onClick={() => onOpenChange(false)}>
                Select
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
