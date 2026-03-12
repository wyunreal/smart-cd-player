import mediasoup from 'mediasoup';
import type {
  Worker,
  Router,
  PlainTransport,
  WebRtcTransport,
  Producer,
  Consumer,
  RtpCapabilities,
  DtlsParameters,
} from 'mediasoup/types';

export const OPUS_PAYLOAD_TYPE = 101;
export const OPUS_SSRC = 11111111;

export interface MediasoupConfig {
  announcedIp: string;
  minPort: number;
  maxPort: number;
}

export class MediasoupManager {
  private worker!: Worker;
  private router!: Router;
  private plainTransport!: PlainTransport;
  private producer: Producer | null = null;
  private readonly config: MediasoupConfig;

  constructor(config: MediasoupConfig) {
    this.config = config;
  }

  async init(): Promise<void> {
    this.worker = await mediasoup.createWorker({
      logLevel: 'warn',
      rtcMinPort: this.config.minPort,
      rtcMaxPort: this.config.maxPort,
    });

    this.worker.on('died', () => {
      console.error('mediasoup worker died, exiting...');
      process.exit(1);
    });

    this.router = await this.worker.createRouter({
      mediaCodecs: [
        {
          kind: 'audio',
          mimeType: 'audio/opus',
          clockRate: 48000,
          channels: 2,
          parameters: {
            useinbandfec: 1,
            usedtx: 0,
            maxplaybackrate: 48000,
            'sprop-stereo': 1,
            stereo: 1,
          },
        },
      ],
    });

    // Plain transport for FFmpeg RTP injection.
    // comedia=true: mediasoup auto-detects source IP/port from first incoming RTP packet.
    this.plainTransport = await this.router.createPlainTransport({
      listenIp: { ip: '127.0.0.1' },
      rtcpMux: true,
      comedia: true,
    });

    // Create producer immediately so mediasoup knows what RTP to expect.
    this.producer = await this.plainTransport.produce({
      kind: 'audio',
      rtpParameters: {
        codecs: [
          {
            mimeType: 'audio/opus',
            payloadType: OPUS_PAYLOAD_TYPE,
            clockRate: 48000,
            channels: 2,
            parameters: {
              useinbandfec: 1,
              'sprop-stereo': 1,
            },
          },
        ],
        encodings: [{ ssrc: OPUS_SSRC }],
      },
    });

    console.log(
      `[mediasoup] PlainTransport listening on 127.0.0.1:${this.plainTransport.tuple.localPort}`,
    );
  }

  /** UDP port where FFmpeg must send RTP */
  get rtpListenPort(): number {
    return this.plainTransport.tuple.localPort;
  }

  get rtpCapabilities(): RtpCapabilities {
    return this.router.rtpCapabilities;
  }

  get isProducerReady(): boolean {
    return this.producer !== null && !this.producer.closed;
  }

  async createWebRtcTransport(): Promise<WebRtcTransport> {
    return this.router.createWebRtcTransport({
      listenIps: [
        {
          ip: '0.0.0.0',
          announcedIp: this.config.announcedIp,
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });
  }

  async connectWebRtcTransport(
    transport: WebRtcTransport,
    dtlsParameters: DtlsParameters,
  ): Promise<void> {
    await transport.connect({ dtlsParameters });
  }

  async createConsumer(
    transport: WebRtcTransport,
    rtpCapabilities: RtpCapabilities,
  ): Promise<Consumer | null> {
    if (!this.producer || this.producer.closed) return null;

    if (
      !this.router.canConsume({
        producerId: this.producer.id,
        rtpCapabilities,
      })
    ) {
      console.warn('[mediasoup] Cannot consume: incompatible RTP capabilities');
      return null;
    }

    return transport.consume({
      producerId: this.producer.id,
      rtpCapabilities,
      paused: true, // client must call resumeConsumer explicitly
    });
  }

  async close(): Promise<void> {
    this.worker?.close();
  }
}
