import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'
ffmpeg.setFfmpegPath('/usr/bin/ffmpeg')

const outputStreams = new Map<string, {
    outputStream: PassThrough,
    proc: ffmpeg.FfmpegCommand
}>()
const rtmpServerUrl = 'rtmp://live.stream.highwebmedia.com/live-origin';

function createVideoProcess(outputUrl: string): { outputStream: PassThrough | null, proc: ffmpeg.FfmpegCommand | null, success: boolean } {

    try {
        const outputStream = new PassThrough()
        const proc = ffmpeg()

        proc.input(outputStream)
            .inputFormat('webm')
            .inputOptions(['-re'])
            .output(outputUrl)
            .outputOptions([
                '-c:v libx264',
                '-preset veryfast',
                '-b:v 3000k',
                '-maxrate 50M',
                '-bufsize 100M',
                '-profile:v main',
                '-c:a aac',
                '-b:a 192k',
                '-s 1280x720',
                '-f flv',
                '-g 60',
            ])
            .on('start', () => {
                console.log('FFmpeg process started');
            })
            .on('stderr', (stderrLine) => {
                console.log('Stderr output: ' + stderrLine);
            })
            .on('error', (err, stdout, stderr) => {
                console.error('Error output: ' + err.message);
                console.error('Stdout output: ' + stdout);
                console.error('Stderr output: ' + stderr);
            })
            .on('end', () => {
                console.log('FFmpeg process ended');
            })
            .run();

        return {
            outputStream,
            proc,
            success: true
        };
    } catch (err) {
        return {
            success: false,
            outputStream: null,
            proc: null
        }
    }

}

function assignVideoProcessToUser(userId: string, streamKey: string) {

    const doc = outputStreams.get(userId)
    if (!doc) {
        const data = createVideoProcess(`${rtmpServerUrl}/${streamKey}`)
        if (!data.success) {
            return
        }
        const { outputStream, proc } = data
        outputStreams.set(userId, { outputStream: outputStream!, proc: proc! })
    }

}

function streamVideo(video: any, userId: string) {

    console.log(video)

    const doc = outputStreams.get(userId)
    if (doc) {
        doc.outputStream.write(video)
    }

}

function closeVideoProcess(userId: string) {
    const doc = outputStreams.get(userId)
    if (doc) {
        doc.outputStream.end()
        doc.proc.kill('SIGKILL')
        outputStreams.delete(userId)
    }
}

export {
    createVideoProcess,
    assignVideoProcessToUser,
    streamVideo,
    closeVideoProcess
}