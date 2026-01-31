"use client";

import { motion } from "framer-motion";
import { Upload, PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <motion.h1
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-h2 font-semibold"
      >
        Settings
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-h3 font-semibold flex items-center gap-2">
              <PenLine className="h-5 w-5 text-primary" />
              Invoice template
            </h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Logo</Label>
              <div className="mt-2 flex items-center gap-4">
                <Avatar className="h-16 w-16 rounded-austin border-2 border-primary/30">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-primary text-h3">
                    IF
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Upload logo
                </Button>
              </div>
            </div>
            <div>
              <Label>Signature (optional)</Label>
              <Input
                type="text"
                placeholder="Your name or company"
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <h3 className="text-h3 font-semibold">Profile</h3>
          </CardHeader>
          <CardContent>
            <p className="text-body text-secondary/70">
              Subscription:{" "}
              <Badge variant="secondary">Free</Badge>{" "}
              <Button variant="link" size="sm" className="p-0 h-auto ml-2" asChild>
                <a href="/pro">Upgrade to Pro</a>
              </Button>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
