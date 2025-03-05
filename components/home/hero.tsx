"use client";

import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import Balancer from "react-wrap-balancer";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';

export default function Hero() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleStartTrading = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push('/dashboard');
    } else {
      router.push('/login');
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl animate-fade-in pt-20 md:px-0 md:pt-20">
      <p className="px-1 text-center text-5xl font-medium sm:text-6xl md:px-0">
        Smart Stock Trading AI
      </p>
      <Balancer className="mx-auto mt-3 max-w-2xl text-center text-lg text-muted-foreground">
        Harness the power of artificial intelligence to make better trading decisions and maximize your returns.
      </Balancer>

      <Card className="mt-3 w-full border-none bg-transparent shadow-none">
        <CardContent className="flex items-center justify-center px-0">
          <Button
            variant="default"
            className="group h-9 bg-primary hover:bg-primary/90"
            onClick={handleStartTrading}
          >
            Start Trading Now
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
