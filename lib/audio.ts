export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private recognition: any = null;
  private onLiveTranscript: (text: string) => void;

  constructor(onLiveTranscript: (text: string) => void) {
    this.onLiveTranscript = onLiveTranscript;
  }

  async start(source: 'mic' | 'system' | 'both', micId?: string) {
    try {
      let micStream: MediaStream | null = null;
      let sysStream: MediaStream | null = null;

      if (source === 'mic' || source === 'both') {
        const audioConstraints: boolean | MediaTrackConstraints = micId && micId !== 'default' 
          ? { deviceId: { exact: micId } } 
          : true;
        micStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints });
      }
      if (source === 'system' || source === 'both') {
        sysStream = await navigator.mediaDevices.getDisplayMedia({ audio: true, video: true });
      }

      this.audioContext = new AudioContext();
      const dest = this.audioContext.createMediaStreamDestination();

      if (micStream) {
        const micSource = this.audioContext.createMediaStreamSource(micStream);
        micSource.connect(dest);
      }
      if (sysStream) {
        const sysSource = this.audioContext.createMediaStreamSource(sysStream);
        sysSource.connect(dest);
      }

      this.stream = dest.stream;

      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.start(1000);

      // Start live transcription using Web Speech API
      if ('webkitSpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        
        let finalTranscript = '';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          this.onLiveTranscript(finalTranscript + interimTranscript);
        };

        this.recognition.start();
      }

    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve) => {
      if (this.recognition) {
        this.recognition.stop();
      }

      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.audioChunks = [];
        
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.audioContext) {
          this.audioContext.close();
        }
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }
}
