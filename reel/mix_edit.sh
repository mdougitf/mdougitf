#!/bin/bash
# Usage : ./mix_edit.sh <video_muette.mp4> <voice.wav> <sfx.wav> <sortie.mp4>
# Voix : coupe-bas, réduction de bruit, compression douce, niveau -14 LUFS ; effets sonores discrets dessous.
ffmpeg -y -loglevel error -i "$1" -i "$2" -i "$3" -filter_complex \
 "[1:a]highpass=f=80,afftdn=nf=-25,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,loudnorm=I=-14:TP=-1.5:LRA=9,aresample=48000,pan=stereo|c0=c0|c1=c0[v];[2:a]aresample=48000,volume=0.38[s];[v][s]amix=inputs=2:normalize=0:duration=first,alimiter=limit=0.95[a]" \
 -map 0:v -map "[a]" -c:v libx264 -crf 20 -preset slow -pix_fmt yuv420p -r 60 -c:a aac -b:a 192k -movflags +faststart -shortest "$4"
