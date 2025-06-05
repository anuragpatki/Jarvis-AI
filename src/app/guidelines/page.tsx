// src/app/guidelines/page.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileTextIcon, YoutubeIcon, MailIcon, SearchIcon, ImageIcon, MapPin, Globe, BotMessageSquare } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function GuidelinesPage() {
  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
           <div className="flex justify-center items-center mb-4">
            <BotMessageSquare className="h-16 w-16 text-primary" data-ai-hint="robot chat" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary">Jarvis AI Guidelines</h1>
          <p className="text-lg text-muted-foreground mt-2">How to interact with your voice-powered assistant.</p>
           <Button asChild variant="outline" className="mt-6">
            <Link href="/">Back to Jarvis</Link>
          </Button>
        </header>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MailIcon className="h-5 w-5 text-primary" />Compose Email</CardTitle>
              <CardDescription>Jarvis can help you draft emails.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Compose an email to john.doe@example.com about our meeting."</li>
                <li>"Draft an email regarding the project update."</li>
                <li>"Help me write an email."</li>
              </ul>
              <p className="mt-2 text-sm">Jarvis will then ask for recipient, subject, and intention in a dialog.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileTextIcon className="h-5 w-5 text-primary" />Generate Document Content</CardTitle>
              <CardDescription>Ask Jarvis to generate content for a document on a specific topic.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Generate a document about renewable energy."</li>
                <li>"Create a doc on the history of the internet."</li>
              </ul>
              <p className="mt-2 text-sm">Jarvis will generate the content and open a new Google Doc. You'll need to copy the content from the app and paste it into the new document.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><YoutubeIcon className="h-5 w-5 text-red-600" />Search YouTube</CardTitle>
              <CardDescription>Find videos on YouTube.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Search YouTube for Next.js tutorials."</li>
                <li>"Find cat videos on YouTube."</li>
                <li>"YouTube funny dog clips."</li>
              </ul>
              <p className="mt-2 text-sm">A new tab will open with YouTube search results.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-green-600" />Search Maps</CardTitle>
              <CardDescription>Find locations on Google Maps.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Search for coffee shops near me on maps."</li>
                <li>"Find the Eiffel Tower on Google Maps."</li>
                <li>"Where is the local library?"</li>
                <li>"Map of Paris."</li>
              </ul>
              <p className="mt-2 text-sm">A new tab will open with Google Maps results.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-blue-500" />Open / Search Website</CardTitle>
              <CardDescription>Open websites or perform a general Google search for a term.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Open Wikipedia."</li>
                <li>"Open BBC News."</li>
                <li>"Open my favorite blog." (Will search Google for "my favorite blog")</li>
              </ul>
              <p className="mt-2 text-sm">A new tab will open with Google search results for the term mentioned after "open".</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SearchIcon className="h-5 w-5 text-primary" />General Search (with Gemini)</CardTitle>
              <CardDescription>Ask Jarvis questions or for information on various topics.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Search for the latest AI news."</li>
                <li>"What is photosynthesis?"</li>
                <li>"Tell me about the Roman Empire."</li>
                <li>"Who was Albert Einstein?"</li>
                <li>"Explain black holes."</li>
              </ul>
              <p className="mt-2 text-sm">Jarvis will provide an answer generated by Gemini directly on the page.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Generate Image</CardTitle>
              <CardDescription>Create images based on your text prompts.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">Example Phrases:</p>
              <ul className="list-disc list-inside pl-4 mt-1 text-sm text-muted-foreground">
                <li>"Create an image of a futuristic city."</li>
                <li>"Generate a picture of a cat wearing a hat."</li>
                <li>"Make an image of a serene landscape."</li>
                <li>"Show me a picture of a dragon."</li>
              </ul>
              <p className="mt-2 text-sm">The generated image will be displayed on the page with a download button.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>General Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p><strong>Start Listening</strong>: Click the "Start Listening" button to activate the microphone.</p>
              <p><strong>Clarity</strong>: Speak clearly and at a moderate pace.</p>
              <p><strong>Microphone</strong>: Ensure your microphone is enabled and working correctly. Check browser permissions if you encounter issues.</p>
              <p><strong>Stopping</strong>: Jarvis will automatically stop listening when you pause, or you can click "Stop Listening."</p>
              <p><strong>Errors</strong>: If Jarvis doesn't understand or an error occurs, it will usually provide voice feedback and a toast message. Try rephrasing your command.</p>
            </CardContent>
          </Card>
        </div>

        <footer className="text-center mt-12 py-4 border-t border-border">
          <p className="text-sm text-muted-foreground">&copy; ${new Date().getFullYear()} Jarvis AI Assistant. </p>
        </footer>
      </div>
    </div>
  );
}
