// src/app/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, FileTextIcon, YoutubeIcon, MailIcon, AlertTriangleIcon, InfoIcon, CheckCircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { processVoiceCommand, handleComposeEmail, type EmailFormData, type ProcessVoiceCommandOutput, type HandleComposeEmailOutput } from './actions';
import EmailDialog from '@/components/jarvis/email-dialog';

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

export default function JarvisPage() {
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [initialEmailIntention, setInitialEmailIntention] = useState('');

  const [commandResult, setCommandResult] = useState<ProcessVoiceCommandOutput | HandleComposeEmailOutput | null>(null);
  
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const resetState = () => {
    setCurrentTranscript('');
    setFinalTranscript('');
    setCommandResult(null);
    setIsLoading(false);
  };

  const processFinalTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    
    resetState();
    setFinalTranscript(text);
    setIsLoading(true);

    try {
      const result = await processVoiceCommand(text);
      setCommandResult(result);

      if (result.type === 'emailComposeIntent') {
        setInitialEmailIntention(text); // Pre-fill intention with the command
        setShowEmailDialog(true);
      } else if (result.type === 'youtubeSearch') {
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(result.query)}`, '_blank');
        toast({ title: "YouTube Search", description: `Searching for "${result.query}" on YouTube.` });
      } else if (result.type === 'googleDoc') {
         toast({ title: "Document Generated", description: `Content for topic "${result.topic}" has been generated.`});
      } else if (result.type === 'unknown') {
        toast({ title: "Request Not Understood", description: result.message, variant: "default" });
      } else if (result.type === 'error') {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }

    } catch (error) {
      console.error("Error processing voice command:", error);
      toast({ title: "Processing Error", description: "An unexpected error occurred.", variant: "destructive" });
      setCommandResult({type: 'error', message: 'An unexpected error occurred while processing.'});
    } finally {
      setIsLoading(false);
    }
  }, [toast]);


  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser doesn't support Speech Recognition. Try Chrome or Edge.",
        variant: "destructive",
        duration: Infinity,
      });
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      resetState();
    };

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setCurrentTranscript(interim);
      if (final) {
        setFinalTranscript(prevFinal => prevFinal + final); // Append final results
        // Debounce or wait for a pause before processing
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim() || currentTranscript.trim()) { // Process if there's any transcript
        processFinalTranscript(finalTranscript.trim() || currentTranscript.trim());
      }
      // Automatically restart if was listening and not stopped manually (optional)
      // if (speechRecognitionRef.current && isListening) {
      // speechRecognitionRef.current.start();
      // }
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      toast({
        title: "Speech Recognition Error",
        description: event.error === 'no-speech' ? "No speech detected." : event.error === 'audio-capture' ? "Audio capture failed." : "An error occurred.",
        variant: "destructive",
      });
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, [toast, processFinalTranscript, finalTranscript, currentTranscript]); // Added finalTranscript and currentTranscript to dependencies

  const handleToggleListen = () => {
    if (!speechRecognitionRef.current) {
      toast({ title: "Voice input not available", description: "Speech recognition is not initialized.", variant: "destructive"});
      return;
    }
    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      resetState(); // Clear previous state before starting new recognition
      setFinalTranscript(''); // Explicitly clear final transcript for new session
      speechRecognitionRef.current.start();
    }
  };

  const handleEmailDialogSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setShowEmailDialog(false);
    try {
      const result = await handleComposeEmail(data);
      setCommandResult(result);
      if (result.type === 'emailDraft') {
        toast({ title: "Email Draft Generated", description: "Your email draft is ready below.", icon: <CheckCircleIcon className="h-5 w-5 text-green-500" /> });
      } else {
        toast({ title: "Email Generation Error", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error("Error submitting email form:", error);
      toast({ title: "Submission Error", description: "Failed to generate email draft.", variant: "destructive" });
      setCommandResult({type: 'error', message: 'Failed to submit email form.'});
    } finally {
      setIsLoading(false);
    }
  };

  const renderCommandResult = () => {
    if (!commandResult) return null;

    switch (commandResult.type) {
      case 'googleDoc':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center"><FileTextIcon className="mr-2 h-6 w-6 text-primary" />Generated Document Content</CardTitle>
              <CardDescription>Topic: {commandResult.topic}</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={commandResult.content} className="h-64 bg-muted/30" />
            </CardContent>
          </Card>
        );
      case 'emailDraft':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center"><MailIcon className="mr-2 h-6 w-6 text-primary" />Generated Email Draft</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={commandResult.draft} className="h-64 bg-muted/30" />
            </CardContent>
             <CardFooter>
              <p className="text-xs text-muted-foreground">You can copy this draft to your email client.</p>
            </CardFooter>
          </Card>
        );
      case 'youtubeSearch': // This is handled by window.open, but we can show a confirmation
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center"><YoutubeIcon className="mr-2 h-6 w-6 text-red-600" />YouTube Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Searching YouTube for: <span className="font-semibold">{commandResult.query}</span></p>
              <p className="text-sm text-muted-foreground">A new tab should have opened with the search results.</p>
            </CardContent>
          </Card>
        );
      case 'unknown':
        return (
          <Card className="w-full max-w-md border-orange-500/50">
            <CardHeader>
              <CardTitle className="flex items-center"><InfoIcon className="mr-2 h-6 w-6 text-orange-500" />Request Not Understood</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{commandResult.message}</p>
              <p className="mt-2 text-sm text-muted-foreground">Your command: "{commandResult.transcript}"</p>
            </CardContent>
          </Card>
        );
      case 'error':
        return (
          <Card className="w-full max-w-md border-destructive/50">
             <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangleIcon className="mr-2 h-6 w-6 text-destructive" />Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{commandResult.message}</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 space-y-6 bg-background font-body">
      <header className="text-center">
        <h1 className="text-5xl font-bold text-primary font-headline">Jarvis</h1>
        <p className="text-muted-foreground mt-2">Your Voice-Powered Assistant</p>
      </header>

      <div className={`mb-2 transition-all duration-300 ease-in-out transform ${isListening ? 'scale-110' : 'scale-100'}`}>
        <Mic 
            className={`
                ${isListening ? 'text-accent animate-pulse' : 'text-primary/70'} 
                transition-colors duration-300
            `} 
            size={80} 
            strokeWidth={1.5}
            data-ai-hint="microphone sound"
        />
      </div>
      
      <Button 
        onClick={handleToggleListen} 
        className="w-56 py-6 text-lg rounded-lg shadow-lg hover:shadow-xl transition-shadow"
        variant={isListening ? "destructive" : "default"}
        disabled={!speechRecognitionRef.current && typeof window !== 'undefined'} // Disable if API not supported
      >
        {isListening ? <MicOff className="mr-2 h-5 w-5" /> : <Mic className="mr-2 h-5 w-5" />}
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </Button>

      {isLoading && (
        <div className="flex items-center space-x-2 text-primary">
          <Loader2 className="animate-spin h-6 w-6" /> 
          <span>Processing your request...</span>
        </div>
      )}
      
      {(currentTranscript || finalTranscript) && !commandResult && !isLoading && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Transcript</CardTitle>
            <CardDescription>What Jarvis heard...</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground">{finalTranscript || currentTranscript}</p>
            {!finalTranscript && currentTranscript && <p className="text-xs text-muted-foreground mt-1">Waiting for final input...</p>}
          </CardContent>
        </Card>
      )}

      {commandResult && (
         <div className="w-full max-w-2xl mt-4 animate-in fade-in duration-500">
            {renderCommandResult()}
        </div>
      )}
      
      {!speechRecognitionRef.current && typeof window !== 'undefined' && (
         <Card className="w-full max-w-md border-destructive/50 mt-4">
             <CardHeader>
              <CardTitle className="flex items-center"><AlertTriangleIcon className="mr-2 h-6 w-6 text-destructive" />Voice Input Not Supported</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Your browser does not support the Speech Recognition API. Please try a different browser like Chrome or Edge.</p>
            </CardContent>
          </Card>
      )}


      <EmailDialog 
        open={showEmailDialog} 
        onOpenChange={setShowEmailDialog} 
        onSubmit={handleEmailDialogSubmit}
        initialIntention={initialEmailIntention}
      />
      <Toaster />
    </div>
  );
}
