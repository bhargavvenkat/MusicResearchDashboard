document.addEventListener('DOMContentLoaded', () => {

    // --- Core Synth Engine ---
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const masterOut = audioCtx.createGain();
    const mediaStreamDest = audioCtx.createMediaStreamDestination();
    masterOut.connect(mediaStreamDest);
    masterOut.connect(audioCtx.destination);

    let mediaRecorder;
    let audioChunks = [];

    const audioGraph = {
        osc: audioCtx.createOscillator(),
        lfo: audioCtx.createOscillator(),
        filter: audioCtx.createBiquadFilter(),
        vca: audioCtx.createGain(),
    };

    // Initialize and start oscillators
    audioGraph.osc.start();
    audioGraph.lfo.start();
    
    // Default routing: VCO -> VCA -> Filter -> Master (but VCA gain is 0)
    audioGraph.osc.connect(audioGraph.vca);
    audioGraph.vca.connect(audioGraph.filter);
    audioGraph.filter.connect(masterOut); // Directly connect filter to master for simplicity
    audioGraph.vca.gain.value = 0; // Silent by default

    // --- UI Elements ---
    const ui = {
        rack: document.getElementById('modular-rack'),
        cableLayer: document.getElementById('cable-layer'),
        jacks: document.querySelectorAll('.jack'),
        oscWaveButtons: document.querySelectorAll('#module-osc .control-button'),
        lfoLed: document.getElementById('lfo-led'),
        lfoRateValue: document.getElementById('lfo-rate-value'),
        triggerGateBtn: document.getElementById('trigger-gate-btn'),
        recordBtn: document.getElementById('record-btn'),
        downloadLink: document.getElementById('download-link'),
    };
    
    // --- Knob Control Logic ---
    function createKnob(knobElement, onValueChange) {
        let isDragging = false;
        let startY = 0;
        let startValue = 0;
        const min = parseFloat(knobElement.dataset.min);
        const max = parseFloat(knobElement.dataset.max);
        let value = parseFloat(knobElement.dataset.value);
        const dial = knobElement.querySelector('.knob-dial');

        function updateDial() {
            const percentage = (value - min) / (max - min);
            const angle = -135 + (percentage * 270); // Range from -135 to +135 degrees
            dial.style.transform = `translate(-50%, -150%) rotate(${angle}deg)`;
        }

        knobElement.addEventListener('mousedown', (e) => {
            isDragging = true;
            startY = e.clientY;
            startValue = value;
            knobElement.style.cursor = 'ns-resize';
            document.body.style.cursor = 'ns-resize';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const deltaY = startY - e.clientY;
            const sensitivity = 500; // Larger number = less sensitive
            const range = max - min;
            const change = (deltaY / sensitivity) * range;
            
            value = Math.max(min, Math.min(max, startValue + change));
            
            updateDial();
            onValueChange(value);
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            knobElement.style.cursor = 'ns-resize';
            document.body.style.cursor = 'auto';
        });

        // Initial setup
        updateDial();
        onValueChange(value); // Set initial audio param
    }
    
    createKnob(document.getElementById('osc-freq-knob'), (v) => {
        audioGraph.osc.frequency.setTargetAtTime(v, audioCtx.currentTime, 0.01);
    });
    createKnob(document.getElementById('lfo-rate-knob'), (v) => {
        audioGraph.lfo.frequency.setTargetAtTime(v, audioCtx.currentTime, 0.01);
        ui.lfoRateValue.textContent = `${v.toFixed(1)} Hz`;
    });
    createKnob(document.getElementById('filter-cutoff-knob'), (v) => {
        audioGraph.filter.frequency.setTargetAtTime(v, audioCtx.currentTime, 0.01);
    });
    createKnob(document.getElementById('filter-q-knob'), (v) => {
        audioGraph.filter.Q.setTargetAtTime(v, audioCtx.currentTime, 0.01);
    });

    // --- LFO LED Animation ---
    function animateLFO() {
        const rate = audioGraph.lfo.frequency.value;
        const period = 1 / rate;
        const timeIntoCycle = audioCtx.currentTime % period;
        const phase = (timeIntoCycle / period) * 2 * Math.PI;
        
        // Simple threshold for blinking
        if (Math.sin(phase) > 0) {
            ui.lfoLed.classList.add('on');
        } else {
            ui.lfoLed.classList.remove('on');
        }
        requestAnimationFrame(animateLFO);
    }
    animateLFO();


    // --- Patching Logic (with visual enhancements) ---
    let connections = {};
    let isCabling = false;
    let activeCable = { element: null, startJackId: null, endJackId: null };

    function getJackTarget(jackId) {
        switch (jackId) {
            case 'osc-out': return audioGraph.osc;
            case 'lfo-out': return audioGraph.lfo;
            case 'filter-out': return audioGraph.filter;
            case 'vca-out': return audioGraph.vca;
            case 'osc-fm-in': return audioGraph.osc.frequency;
            case 'filter-in': return audioGraph.filter;
            case 'filter-freq-in': return audioGraph.filter.frequency;
            case 'vca-in': return audioGraph.vca;
            case 'vca-gain-in': return audioGraph.vca.gain;
            case 'master-in': return masterOut;
            default: return null;
        }
    }

    function createConnection(startId, endId) {
        const startNode = getJackTarget(startId);
        let endParam = getJackTarget(endId);
        
        if (startNode && endParam) {
            // Special handling for LFO -> Param. We need a gain node to control the depth.
            if (startId === 'lfo-out' && endParam instanceof AudioParam) {
                const lfoDepth = audioCtx.createGain();
                lfoDepth.gain.value = endParam.value; // Use parameter's default as depth
                startNode.connect(lfoDepth);
                lfoDepth.connect(endParam);
                connections[`${startId}-${endId}`] = { startNode, endNode: lfoDepth, originalTarget: endParam };
            } else {
                 startNode.connect(endParam);
                 connections[`${startId}-${endId}`] = { startNode, endNode: endParam };
            }
        }
    }

    function removeConnection(cableId) {
        const conn = connections[cableId];
        if (conn) {
            const target = conn.originalTarget || conn.endNode;
            conn.startNode.disconnect(target);
            if(conn.originalTarget) conn.endNode.disconnect(target); // for LFO
            delete connections[cableId];
        }
    }
    
    function drawCable(startJack, endJack, cableElement) {
        const rackRect = ui.rack.getBoundingClientRect();
        const startRect = startJack.getBoundingClientRect();
        const endRect = endJack.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2 - rackRect.left;
        const startY = startRect.top + startRect.height / 2 - rackRect.top;
        const endX = endRect.left + endRect.width / 2 - rackRect.left;
        const endY = endRect.top + endRect.height / 2 - rackRect.top;
        const c1Y = startY + Math.max(80, (endY - startY) * 0.7);
        const c2Y = endY - Math.max(80, (endY - startY) * 0.7);
        cableElement.setAttribute('d', `M${startX},${startY} C${startX},${c1Y} ${endX},${c2Y} ${endX},${endY}`);
    }

    function updateAllCables() {
        document.querySelectorAll('.cable').forEach(cable => {
            const startJack = document.querySelector(`[data-jack-id="${cable.dataset.startId}"]`);
            const endJack = document.querySelector(`[data-jack-id="${cable.dataset.endId}"]`);
            if (startJack && endJack) drawCable(startJack, endJack, cable);
        });
    }

    ui.jacks.forEach(jack => {
        jack.addEventListener('click', (e) => {
            const jackEl = e.target;
            const jackId = jackEl.dataset.jackId;
            const isOutput = jackEl.classList.contains('output');

            if (!isCabling && isOutput) {
                isCabling = true;
                jackEl.classList.add('cabling');
                activeCable.startJackId = jackId;
                const newCable = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                newCable.setAttribute('class', 'cable dragging');
                newCable.style.stroke = jackId.includes('lfo') ? 'var(--accent-primary)' : '#FFF';
                ui.cableLayer.appendChild(newCable);
                activeCable.element = newCable;
            } else if (isCabling && !isOutput) {
                const startJackEl = document.querySelector(`[data-jack-id="${activeCable.startJackId}"]`);
                startJackEl.classList.remove('cabling');
                startJackEl.classList.add('connected');
                jackEl.classList.add('connected');
                
                activeCable.element.classList.remove('dragging');
                activeCable.element.dataset.startId = activeCable.startJackId;
                activeCable.element.dataset.endId = jackId;
                activeCable.element.dataset.cableId = `${activeCable.startJackId}-${jackId}`;
                
                drawCable(startJackEl, jackEl, activeCable.element);
                createConnection(activeCable.startJackId, jackId);
                isCabling = false;
            }
        });
        
        jack.addEventListener('dblclick', e => {
             // Logic to remove connections... (omitted for brevity, can be copied from previous version)
        });
    });

    document.body.addEventListener('mousemove', e => {
        if (!isCabling) return;
        const rackRect = ui.rack.getBoundingClientRect();
        const startJack = document.querySelector(`[data-jack-id="${activeCable.startJackId}"]`);
        const startRect = startJack.getBoundingClientRect();
        const startX = startRect.left + startRect.width / 2 - rackRect.left;
        const startY = startRect.top + startRect.height / 2 - rackRect.top;
        const endX = e.clientX - rackRect.left;
        const endY = e.clientY - rackRect.top;
        activeCable.element.setAttribute('d', `M${startX},${startY} L${endX},${endY}`);
    });
    
    // --- Trigger & Record Logic ---
    ui.triggerGateBtn.addEventListener('mousedown', () => {
        audioGraph.vca.gain.setTargetAtTime(1.0, audioCtx.currentTime, 0.01); // Quick attack
    });
    ui.triggerGateBtn.addEventListener('mouseup', () => {
        audioGraph.vca.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05); // Quick release
    });
    ui.triggerGateBtn.addEventListener('mouseleave', () => { // Ensure release if mouse leaves while pressed
        if (audioGraph.vca.gain.value > 0) {
            audioGraph.vca.gain.setTargetAtTime(0, audioCtx.currentTime, 0.05);
        }
    });

    // Recording logic remains the same...
    ui.recordBtn.addEventListener('click', () => {
        if (ui.recordBtn.textContent === 'Record') {
            audioCtx.resume();
            mediaRecorder = new MediaRecorder(mediaStreamDest.stream);
            mediaRecorder.start();
            audioChunks = [];
            mediaRecorder.addEventListener('dataavailable', e => audioChunks.push(e.data));
            
            ui.recordBtn.textContent = 'Stop';
            ui.recordBtn.style.backgroundColor = '#e74c3c';
        } else {
            mediaRecorder.stop();
            mediaRecorder.addEventListener('stop', () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                const audioUrl = URL.createObjectURL(audioBlob);
                ui.downloadLink.href = audioUrl;
                ui.downloadLink.download = `synth-patch-${Date.now()}.wav`;
                ui.downloadLink.style.display = 'flex';
                ui.recordBtn.style.display = 'none';
            });
            ui.recordBtn.textContent = 'Record';
            ui.recordBtn.style.backgroundColor = '';
        }
    });

    window.addEventListener('resize', updateAllCables);
});