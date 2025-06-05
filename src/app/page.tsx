
// src/app/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Loader2, FileTextIcon, YoutubeIcon, MailIcon, AlertTriangleIcon, InfoIcon, CheckCircleIcon, Copy as CopyIcon, SearchIcon, ImageIcon, Download as DownloadIcon, MapPin, Globe, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { processVoiceCommand, handleComposeEmail, type ProcessVoiceCommandOutput, type HandleComposeEmailOutput } from './actions';
import EmailDialog from '@/components/jarvis/email-dialog';
import type { EmailFormData } from '@/lib/schemas';
import Image from 'next/image';
import AppSidebar from '@/components/jarvis/AppSidebar';
import { SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useHistory } from '@/hooks/useHistory';


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
  const finalTranscriptRef = useRef('');

  const [isLoading, setIsLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [initialEmailIntention, setInitialEmailIntention] = useState('');

  const [commandResult, setCommandResult] = useState<ProcessVoiceCommandOutput | HandleComposeEmailOutput | null>(null);
  const [speechSupport, setSpeechSupport] = useState<'pending' | 'supported' | 'unsupported'>('pending');

  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const startSoundRef = useRef<HTMLAudioElement | null>(null);
  const stopSoundRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();
  const { addHistoryItem } = useHistory();
  const { isMobile } = useSidebar();

  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error("Speech synthesis error:", error);
      }
    } else {
      console.warn("Speech synthesis not supported by this browser.");
    }
  }, []);


  const resetState = useCallback(() => {
    setCurrentTranscript('');
    setFinalTranscript('');
    finalTranscriptRef.current = '';
    setCommandResult(null);
    setIsLoading(false);
  }, []);

  const processFinalTranscript = useCallback(async (text: string) => {
    if (!text.trim()) {
      setIsLoading(false);
      return;
    }

    setCommandResult(null);
    setIsLoading(true);
    setFinalTranscript(text);
    let historyEntry: Parameters<typeof addHistoryItem>[0] = { transcript: text, actionType: 'unknown' };

    try {
      const result = await processVoiceCommand(text);
      setCommandResult(result);
      historyEntry.actionType = result.type;

      if (result.type === 'emailComposeIntent') {
        speakText("Please provide email details.");
        setInitialEmailIntention(text);
        setShowEmailDialog(true);
      } else if (result.type === 'youtubeSearch') {
        speakText(`Searching YouTube for ${result.query}.`);
        window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(result.query)}`, '_blank');
        toast({ title: "YouTube Search", description: `Searching for "${result.query}" on YouTube.` });
        historyEntry.query = result.query;
      } else if (result.type === 'mapsSearch') {
        speakText(`Searching for ${result.query} on Google Maps.`);
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.query)}`, '_blank');
        toast({ title: "Google Maps Search", description: `Searching for "${result.query}" on Google Maps.` });
        historyEntry.query = result.query;
      } else if (result.type === 'openWebsiteSearch') {
        speakText(`Okay, searching for ${result.query}.`);
        window.open(`https://www.google.com/search?q=${encodeURIComponent(result.query)}`, '_blank');
        toast({ title: "Open / Search", description: `Searching for "${result.query}" to open.` });
        historyEntry.query = result.query;
      } else if (result.type === 'googleDoc') {
         speakText(`Document content generated for topic: ${result.topic}. Opening a new Google Doc. Please copy the content and paste it into the new document.`);
         window.open('https://docs.new', '_blank');
         toast({ title: "Document Generated", description: `Content for topic "${result.topic}" generated. A new Google Doc is opening. Copy the content below.`});
         historyEntry.topic = result.topic;
      } else if (result.type === 'geminiSearch') {
        speakText(`Here's what I found about ${result.query}.`);
        toast({ title: `Search Results for "${result.query}"`, description: "Displaying results from Gemini below." });
        historyEntry.query = result.query;
      } else if (result.type === 'imageGenerated') {
        speakText(`Okay, I've generated an image for: ${result.prompt}.`);
        toast({ title: "Image Generated", description: `Image for "${result.prompt}" is displayed below.` });
        historyEntry.prompt = result.prompt;
      } else if (result.type === 'unknown') {
        speakText(result.message);
        toast({ title: "Request Not Understood", description: result.message, variant: "default" });
      } else if (result.type === 'error') {
        speakText(`An error occurred: ${result.message}`);
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
      addHistoryItem(historyEntry);
    } catch (error) {
      console.error("Error processing voice command:", error);
      const errorMessage = "An unexpected error occurred while processing.";
      speakText(errorMessage);
      toast({ title: "Processing Error", description: errorMessage, variant: "destructive" });
      setCommandResult({type: 'error', message: errorMessage});
      addHistoryItem({ ...historyEntry, actionType: 'error' });
    } finally {
      setIsLoading(false);
    }
  }, [toast, setInitialEmailIntention, setShowEmailDialog, speakText, addHistoryItem]);


  useEffect(() => {
    if (typeof window === 'undefined') {
      setSpeechSupport('unsupported');
      return;
    }

    try {
      startSoundRef.current = new Audio('/sounds/start-listening.mp3');
      stopSoundRef.current = new Audio('/sounds/stop-listening.mp3');
    } catch (e) {
      console.error("Error initializing audio files. Ensure /sounds/start-listening.mp3 and /sounds/stop-listening.mp3 exist in public folder.", e);
      toast({title: "Audio Error", description: "Could not load listening sound effects.", variant: "destructive", duration: 7000});
    }


    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setSpeechSupport('unsupported');
      const errorMsg = "Your browser doesn't support Speech Recognition. Try Chrome or Edge.";
      // speakText("Speech recognition is not supported on this browser."); // This might be too early if synthesis isn't ready
      toast({
        title: "Voice Input Not Supported",
        description: errorMsg,
        variant: "destructive",
        duration: 7000,
      });
      return;
    }

    setSpeechSupport('supported');
    const recognition = new SpeechRecognitionAPI();
    speechRecognitionRef.current = recognition;

    recognition.continuous = false; // Stop after first pause
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      setCurrentTranscript('');
      finalTranscriptRef.current = ''; // Clear ref
      setCommandResult(null); // Clear previous results
      setIsLoading(false); // Reset loading state
      startSoundRef.current?.play().catch(e => console.error("Error playing start sound:", e));
    };

    recognition.onresult = (event) => {
      let interim = '';
      let finalUtterance = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcriptPart = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalUtterance += transcriptPart;
        } else {
          interim += transcriptPart;
        }
      }
      setCurrentTranscript(interim);
      if (finalUtterance) {
        finalTranscriptRef.current = finalUtterance.trim(); // Update ref with final part
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      stopSoundRef.current?.play().catch(e => console.error("Error playing stop sound:", e));
      const transcriptToProcess = finalTranscriptRef.current.trim();
      if (transcriptToProcess) {
        processFinalTranscript(transcriptToProcess);
      } else {
        // If speechRecognitionRef.current.onerror was called for 'no-speech', it handles the toast.
        // Otherwise, if it ended with no final transcript and no error, it might be a quick stop.
        if (!isLoading && !currentTranscript && speechRecognitionRef.current && (speechRecognitionRef.current as any)._error !== 'no-speech') {
          // Do nothing specific if stopped quickly without speech, unless specific UX is desired
        }
        setIsLoading(false);
      }
    };

    recognition.onerror = (event) => {
      (speechRecognitionRef.current as any)._error = event.error; // Track error for onend logic
      let description = "An error occurred during speech recognition.";
      let title = "Speech Recognition Error";
      let toastVariant: "default" | "destructive" = "destructive";

      if (event.error === 'no-speech') {
        title = "No Speech Detected";
        description = "I didn't hear anything. Please ensure your microphone is working and try speaking clearly.";
        toastVariant = "default";
      } else if (event.error === 'audio-capture') {
        console.error("Speech recognition error (audio-capture): Microphone issue or permissions. Event:", event);
        description = "Audio capture failed. Please check your microphone permissions and ensure it's connected.";
      } else if (event.error === 'not-allowed') {
        console.error("Speech recognition error (not-allowed): Microphone access denied. Event:", event);
        description = "Microphone access was denied. Please allow microphone access in your browser settings.";
      } else {
        console.error(`Unexpected speech recognition error: ${event.error}. Event:`, event);
        description = `An unexpected speech error occurred: ${event.error}. Please try again.`;
      }

      speakText(description);
      toast({
        title: title,
        description: description,
        variant: toastVariant,
      });

      setIsListening(false);
      setIsLoading(false);
      stopSoundRef.current?.play().catch(e => console.error("Error playing stop sound on error:", e));
    };

    return () => {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.onstart = null;
        speechRecognitionRef.current.onresult = null;
        speechRecognitionRef.current.onend = null;
        speechRecognitionRef.current.onerror = null;
        speechRecognitionRef.current.stop(); // Ensure it's stopped on unmount
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel(); // Clear any pending speech
      }
    };
  // Removed speakText from dependencies as it is stable due to its own useCallback with empty deps
  }, [toast, processFinalTranscript]);

  const handleToggleListen = () => {
    if (speechSupport !== 'supported' || !speechRecognitionRef.current) {
      const msg = "Speech recognition is not initialized or not supported.";
      speakText(msg);
      toast({ title: "Voice input not available", description: msg, variant: "destructive"});
      return;
    }

    const recognition = speechRecognitionRef.current;
    if (isListening) {
      recognition.stop();
    } else {
      resetState(); // Clear everything before starting
      (recognition as any)._error = null; // Reset error state before starting
      try {
        recognition.start();
      } catch (error) {
        console.error("Error starting recognition:", error);
        let msg = "Could not start voice recognition.";
        if ((error as Error).name === 'InvalidStateError') {
            // This can happen if stop() was called and it hasn't fully finished
            // or if start() is called rapidly.
            msg = "Recognition already active or ending. Please wait a moment and try again.";
        }
        speakText(msg);
        toast({ title: "Recognition Error", description: msg, variant: "destructive" });
        setIsListening(false); // Ensure state is consistent
      }
    }
  };

  const handleEmailDialogSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setShowEmailDialog(false);
    const historyBase = { transcript: `Email to ${data.recipient}: ${data.subject}`, query: data.intention };
    try {
      const result = await handleComposeEmail(data);
      setCommandResult(result);
      if (result.type === 'emailDraft') {
        speakText("Email draft generated. Opening Gmail.");
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.recipient)}&su=${encodeURIComponent(data.subject)}&body=${encodeURIComponent(result.draft)}`;
        window.open(gmailUrl, '_blank');
        toast({ title: "Email Draft Generated", description: "Your email draft is ready below. A Gmail compose window has also opened.", icon: <CheckCircleIcon className="h-5 w-5 text-green-500" /> });
        addHistoryItem({ ...historyBase, actionType: 'emailDraft' });
      } else {
        speakText(`Failed to compose email draft. ${result.message}`);
        toast({ title: "Email Generation Error", description: result.message, variant: "destructive" });
        addHistoryItem({ ...historyBase, actionType: 'error' });
      }
    } catch (error) {
      console.error("Error submitting email form:", error);
      const errorMsg = "Failed to generate email draft.";
      speakText(errorMsg);
      toast({ title: "Submission Error", description: errorMsg, variant: "destructive" });
      setCommandResult({type: 'error', message: 'Failed to submit email form.'});
      addHistoryItem({ ...historyBase, actionType: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Content Copied", description: "Document content copied to clipboard!" });
      speakText("Content copied to clipboard.");
    }).catch(err => {
      console.error("Failed to copy text: ", err);
      toast({ title: "Copy Failed", description: "Could not copy content to clipboard.", variant: "destructive" });
      speakText("Failed to copy content.");
    });
  };

  const handleDownloadImage = (imageDataUri: string, prompt: string) => {
    if (!imageDataUri) {
      toast({ title: "Download Failed", description: "Image data is not available.", variant: "destructive" });
      speakText("Image data is not available for download.");
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = imageDataUri;
      
      // Sanitize prompt for filename
      let filename = prompt ? prompt.replace(/[^a-z0-9_]+/gi, '_').substring(0, 50) : 'jarvis_generated_image';
      filename = `${filename || 'jarvis_generated_image'}.png`; // Ensure .png extension
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "Image Download Started", description: `Downloading ${filename}` });
      speakText("Image download started.");
    } catch (error) {
      console.error("Failed to download image: ", error);
      toast({ title: "Download Failed", description: "Could not initiate image download.", variant: "destructive" });
      speakText("Failed to download image.");
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
              <CardDescription>Topic: {commandResult.topic}. A new Google Doc has opened. Copy the content below and paste it there.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={commandResult.content} className="h-64 bg-muted/30" />
            </CardContent>
             <CardFooter className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Manually copy and paste into the new Google Doc tab.</p>
              <Button onClick={() => handleCopyToClipboard(commandResult.content)} variant="outline" size="sm">
                <CopyIcon className="mr-2 h-4 w-4" /> Copy Content
              </Button>
            </CardFooter>
          </Card>
        );
      case 'emailDraft':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center"><MailIcon className="mr-2 h-6 w-6 text-primary" />Generated Email Draft</CardTitle>
              <CardDescription>A Gmail compose window has been opened with this draft.</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={commandResult.draft} className="h-64 bg-muted/30" />
            </CardContent>
             <CardFooter>
              <p className="text-xs text-muted-foreground">You can review and send the email from the Gmail tab.</p>
            </CardFooter>
          </Card>
        );
      case 'youtubeSearch':
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
      case 'mapsSearch':
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center"><MapPin className="mr-2 h-6 w-6 text-green-600" />Google Maps Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Searching Google Maps for: <span className="font-semibold">{commandResult.query}</span></p>
              <p className="text-sm text-muted-foreground">A new tab should have opened with the map results.</p>
            </CardContent>
          </Card>
        );
      case 'openWebsiteSearch':
        return (
          <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center"><Globe className="mr-2 h-6 w-6 text-blue-500" />Open / Search</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Searching for: <span className="font-semibold">{commandResult.query}</span></p>
              <p className="text-sm text-muted-foreground">A new tab should have opened with the Google search results.</p>
            </CardContent>
          </Card>
        );
      case 'geminiSearch':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center"><SearchIcon className="mr-2 h-6 w-6 text-primary" />Search Result</CardTitle>
              <CardDescription>Query: "{commandResult.query}"</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea readOnly value={commandResult.result} className="h-64 bg-muted/30" />
            </CardContent>
             <CardFooter>
              <p className="text-xs text-muted-foreground">Content generated by Gemini.</p>
            </CardFooter>
          </Card>
        );
      case 'imageGenerated':
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="flex items-center"><ImageIcon className="mr-2 h-6 w-6 text-primary" />Generated Image</CardTitle>
              <CardDescription>Prompt: "{commandResult.prompt}"</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center items-center">
              {commandResult.imageDataUri ? (
                <Image
                  src={commandResult.imageDataUri}
                  alt={`Generated image for prompt: ${commandResult.prompt}`}
                  width={512}
                  height={512}
                  className="rounded-md shadow-lg"
                  data-ai-hint="generated art"
                />
              ) : (
                <p>Image could not be displayed.</p>
              )}
            </CardContent>
             <CardFooter className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">Image generated by Gemini.</p>
              <Button onClick={() => handleDownloadImage(commandResult.imageDataUri, commandResult.prompt)} variant="outline" size="sm">
                <DownloadIcon className="mr-2 h-4 w-4" /> Download Image
              </Button>
            </CardFooter>
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
    <div className="flex h-screen">
      <AppSidebar />
      <SidebarInset>
        <div className="flex flex-col items-center justify-center min-h-full p-6 space-y-6 bg-background font-body overflow-y-auto">
          <div className="absolute top-4 left-4 z-20">
            <SidebarTrigger className={isMobile ? '' : 'md:hidden'}>
                <Menu />
            </SidebarTrigger>
          </div>
          <header className="text-center mt-8 md:mt-0"> {/* Added margin top for mobile to avoid overlap */}
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
            disabled={speechSupport !== 'supported' || isLoading}
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
                <CardDescription>What Jarvis is hearing or has processed...</CardDescription>
              </CardHeader>
              <CardContent>
                {isListening && currentTranscript && <p className="text-sm text-muted-foreground"><em>Listening: {currentTranscript}</em></p>}
                {finalTranscript && !isListening && <p className="text-sm text-foreground">Processed: "{finalTranscript}"</p>}
                {!isListening && !finalTranscript && currentTranscript && <p className="text-xs text-muted-foreground mt-1">Interim: {currentTranscript}</p>}
              </CardContent>
            </Card>
          )}

          {commandResult && (
             <div className="w-full max-w-2xl mt-4 animate-in fade-in duration-500">
                {renderCommandResult()}
            </div>
          )}

          {speechSupport === 'pending' && !isLoading && (
             <div className="flex items-center space-x-2 text-primary mt-4">
               <Loader2 className="animate-spin h-6 w-6" />
               <span>Checking voice support...</span>
             </div>
           )}
          {speechSupport === 'unsupported' && (
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
      </SidebarInset>
    </div>
  );
}
