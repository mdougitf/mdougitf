#!/bin/bash
# Usage : ./mix_edit.sh <video_muette.mp4> <voice.wav> <sfx.wav> <sortie.mp4>
# Voix : coupe-bas, réduction de bruit, moins de « carton » (280 Hz), plus de présence (3,6 kHz), dé-esseur,
# compression douce, niveau -14 LUFS ; effets sonores discrets dessous.
ffmpeg -y -loglevel error -i "$1" -i "$2" -i "$3" -filter_complex \
 "[1:a]highpass=f=85,afftdn=nf=-28:tn=1,equalizer=f=280:t=q:w=1.2:g=-3,equalizer=f=3600:t=q:w=1.4:g=3,equalizer=f=120:t=q:w=1:g=1.5,deesser=i=0.35,acompressor=threshold=-20dB:ratio=3:attack=5:release=90:makeup=2,loudnorm=I=-14:TP=-1.5:LRA=8,aresample=48000,pan=stereo|c0=c0|c1=c0[v];[2:a]aresample=48000,volume=0.38[s];[v][s]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95,loudnorm=I=-14:TP=-1.5:LRA=8[a]" \
 -map 0:v -map "[a]" -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -r 60 -c:a aac -b:a 192k -movflags +faststart -shortest "$4"
