let procs = [];
let nextPid = 1;
let simulationSteps = [];
let currentStepIndex = 0;

const elems = {
    arrival: document.getElementById('arrival'),
    burst: document.getElementById('burst'),
    addBtn: document.getElementById('addProc'),
    procTable: document.getElementById('procTable'),
    procTableWrap: document.getElementById('procTableWrap'),
    tableBody: document.querySelector('#procTable tbody'),
    simulate: document.getElementById('simulate'),
    clearAll: document.getElementById('clearAll'),
    algo: document.getElementById('algo'),
    quantumWrap: document.getElementById('quantumWrap'),
    quantum: document.getElementById('quantum'),
    result: document.getElementById('result'),
    ganttWrap: document.getElementById('ganttWrap'),
    outTable: document.querySelector('#outTable tbody'),
    procCount: document.getElementById('procCount'),
    stepVisualization: document.getElementById('stepVisualization'),
    prevStep: document.getElementById('prevStep'),
    nextStep: document.getElementById('nextStep'),
    currentStep: document.getElementById('currentStep'),
    totalSteps: document.getElementById('totalSteps'),
    currentTime: document.getElementById('currentTime'),
    currentProcess: document.getElementById('currentProcess'),
    readyQueue: document.getElementById('readyQueue'),
    stepGanttWrap: document.getElementById('stepGanttWrap'),
    avgTAT: document.getElementById('avgTAT'),
    avgWT: document.getElementById('avgWT')
};

// Konfigurasi SweetAlert2 default
const Toast = Swal.mixin({
    toast: true,
    position: 'bottom-right',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer)
        toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
});

function showToast(message, icon = 'info') {
    Toast.fire({
        icon: icon,
        title: message
    });
}

function showAlert(title, text, icon = 'info') {
    Swal.fire({
        title: title,
        text: text,
        icon: icon,
        confirmButtonColor: '#4a90e2',
        confirmButtonText: 'OK'
    });
}

function reindexPids() {
    procs.sort((a, b) => a.pid - b.pid);
    procs.forEach((p, idx) => {
        p.pid = idx + 1;
    });
    nextPid = procs.length + 1;
}

function refreshProcTable() {
    const count = procs.length;
    elems.procCount.textContent = `${count} proses`;
    
    if (count === 0) {
        elems.procTable.style.display = 'none';
        elems.procTableWrap.querySelector('.empty-state').style.display = 'block';
        return;
    }

    elems.procTable.style.display = 'table';
    elems.procTableWrap.querySelector('.empty-state').style.display = 'none';
    elems.tableBody.innerHTML = '';
    
    for (const p of procs) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>P${p.pid}</strong></td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>
                <button class="btn-danger" data-pid="${p.pid}" 
                        style="padding: 6px 16px; font-size: 0.9rem; 
                        display:flex; align-items:center; gap:6px;">
                    <i class="fi fi-rr-trash"></i>
                </button>
            </td>
        `;
        elems.tableBody.appendChild(tr);
    }

    elems.tableBody.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
            const pid = Number(b.getAttribute('data-pid'));
            procs = procs.filter(x => x.pid !== pid);
            reindexPids();
            refreshProcTable();
            showToast(`Proses P${pid} dihapus`, 'success');
        });
    });
}

elems.addBtn.addEventListener('click', () => {
    const arrival = Number(elems.arrival.value);
    const burst = Number(elems.burst.value);
    
    if (burst <= 0) {
        showToast('Burst time harus lebih dari 0', 'error');
        return;
    }

    procs.push({ pid: nextPid, arrival, burst });
    showToast(`Proses P${nextPid} ditambahkan`, 'success');
    nextPid++;
    refreshProcTable();
});

elems.algo.addEventListener('change', () => {
    const algo = elems.algo.value;
    elems.quantumWrap.style.display = algo === 'Round Robin' ? 'block' : 'none';
});

elems.clearAll.addEventListener('click', () => {
    Swal.fire({
        title: 'Hapus Semua Proses?',
        text: 'Tindakan ini tidak dapat dibatalkan',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e25858',
        cancelButtonColor: '#4a90e2',
        confirmButtonText: 'Hapus',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            procs = [];
            nextPid = 1;
            elems.algo.value = "";
            elems.quantumWrap.style.display = 'none';
            refreshProcTable();
            elems.result.style.display = 'none';
            elems.stepVisualization.style.display = 'none';
            showToast('Semua proses dihapus', 'success');
        }
    });
});

elems.simulate.addEventListener('click', () => {
    if (procs.length === 0) {
        showToast('Tambahkan proses terlebih dahulu', 'warning');
        return;
    }

    if (!elems.algo.value) {
        showToast('Pilih algoritma terlebih dahulu', 'warning');
        return;
    }

    const algo = elems.algo.value;
    const quantum = Number(elems.quantum.value);
    const result = runLocalSimulation(procs.map(p => ({ ...p })), algo, quantum);
    
    simulationSteps = result.steps;
    currentStepIndex = 0;
    
    renderStepVisualization();
    renderResult(result);
    
    elems.stepVisualization.style.display = 'block';
    elems.stepVisualization.scrollIntoView({ behavior: 'smooth' });
    
    showToast('Simulasi selesai!', 'success');
});

elems.prevStep.addEventListener('click', () => {
    if (currentStepIndex > 0) {
        currentStepIndex--;
        renderStepVisualization();
    }
});

elems.nextStep.addEventListener('click', () => {
    if (currentStepIndex < simulationSteps.length - 1) {
        currentStepIndex++;
        renderStepVisualization();
    }
});

function renderStepVisualization() {
    if (simulationSteps.length === 0) return;
    
    const step = simulationSteps[currentStepIndex];
    
    elems.currentStep.textContent = `Step ${currentStepIndex + 1}`;
    elems.totalSteps.textContent = simulationSteps.length;
    elems.currentTime.textContent = step.time;
    
    elems.prevStep.disabled = currentStepIndex === 0;
    elems.nextStep.disabled = currentStepIndex === simulationSteps.length - 1;
    
    if (step.currentProcess) {
        elems.currentProcess.innerHTML = `
            <h4>Proses yang sedang berjalan:</h4>
            <div class="process-item">
                P${step.currentProcess.pid} 
                (Remaining: ${step.currentProcess.remaining}/${step.currentProcess.burst})
            </div>
        `;
    } else {
        elems.currentProcess.innerHTML = `
            <h4>Status:</h4>
            <p style="color: #718096;">CPU Idle - Menunggu proses...</p>
        `;
    }
    
    if (step.readyQueue && step.readyQueue.length > 0) {
        const queueItems = step.readyQueue.map(p => 
            `<span class="process-item">P${p.pid} (Rem: ${p.remaining})</span>`
        ).join('');
        elems.readyQueue.innerHTML = `
            <h4>Ready Queue:</h4>
            <div>${queueItems}</div>
        `;
    } else {
        elems.readyQueue.innerHTML = `
            <h4>Ready Queue:</h4>
            <p style="color: #718096;">Kosong</p>
        `;
    }
    
    renderStepGanttChart(step.ganttSoFar);
}

function renderStepGanttChart(ganttData) {
    elems.stepGanttWrap.innerHTML = '';
    if (!ganttData || ganttData.length === 0) return;
    
    const ganttChart = document.createElement('div');
    ganttChart.className = 'gantt-chart';
    const minTime = ganttData[0].start;
    const maxTime = ganttData[ganttData.length - 1].end;
    const totalDuration = maxTime - minTime;

    for (const seg of ganttData) {
        const width = totalDuration > 0 ? ((seg.end - seg.start) / totalDuration) * 100 : 0;
        const block = document.createElement('div');
        block.className = 'gantt-block';
        block.style.width = width + '%';
        
        if (seg.pid === 'idle') {
            block.style.background = '#e2e8f0';
            block.textContent = 'CPU Idle';
            block.style.color = '#718096';
        } else {
            block.style.background = getColor(seg.pid);
            block.textContent = `P${seg.pid}`;
        }
        
        block.title = `P${seg.pid === 'idle' ? 'CPU Idle' : seg.pid}: ${seg.start} → ${seg.end}`;
        ganttChart.appendChild(block);
    }
    elems.stepGanttWrap.appendChild(ganttChart);

    const timeline = document.createElement('div');
    timeline.className = 'gantt-timeline';
    for (const seg of ganttData) {
        const width = totalDuration > 0 ? ((seg.end - seg.start) / totalDuration) * 100 : 0;
        const time = document.createElement('div');
        time.style.width = width + '%';
        time.textContent = seg.start;
        timeline.appendChild(time);
    }
    const lastTime = document.createElement('div');
    lastTime.textContent = maxTime;
    timeline.appendChild(lastTime);
    elems.stepGanttWrap.appendChild(timeline);
}

function renderResult(result) {
    elems.result.style.display = 'block';

    elems.ganttWrap.innerHTML = '';
    
    if (result.gantt.length > 0) {
        const ganttChart = document.createElement('div');
        ganttChart.className = 'gantt-chart';
        const minTime = result.gantt[0].start;
        const maxTime = result.gantt[result.gantt.length - 1].end;
        const totalDuration = maxTime - minTime;

        for (const seg of result.gantt) {
            const width = totalDuration > 0 ? ((seg.end - seg.start) / totalDuration) * 100 : 0;
            const block = document.createElement('div');
            block.className = 'gantt-block';
            block.style.width = width + '%';
            
            if (seg.pid === 'idle') {
                block.style.background = '#e2e8f0';
                block.textContent = 'CPU Idle';
                block.style.color = '#718096';
            } else {
                block.style.background = getColor(seg.pid);
                block.textContent = `P${seg.pid}`;
            }
            
            block.title = `P${seg.pid === 'idle' ? 'CPU Idle' : seg.pid}: ${seg.start} → ${seg.end}`;
            ganttChart.appendChild(block);
        }
        elems.ganttWrap.appendChild(ganttChart);

        const timeline = document.createElement('div');
        timeline.className = 'gantt-timeline';
        for (const seg of result.gantt) {
            const width = totalDuration > 0 ? ((seg.end - seg.start) / totalDuration) * 100 : 0;
            const time = document.createElement('div');
            time.style.width = width + '%';
            time.textContent = seg.start;
            timeline.appendChild(time);
        }
        const lastTime = document.createElement('div');
        lastTime.textContent = maxTime;
        timeline.appendChild(lastTime);
        elems.ganttWrap.appendChild(timeline);
    }

    elems.outTable.innerHTML = '';
    let totalTAT = 0;
    let totalWT = 0;
    
    for (const r of result.table) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>P${r.pid}</strong></td>
            <td>${r.arrival}</td>
            <td>${r.burst}</td>
            <td>${r.ct}</td>
            <td>${r.tat}</td>
            <td>${r.wt}</td>
        `;
        elems.outTable.appendChild(tr);
        totalTAT += r.tat;
        totalWT += r.wt;
    }

    const avgTAT = (totalTAT / result.table.length).toFixed(2);
    const avgWT = (totalWT / result.table.length).toFixed(2);
    elems.avgTAT.textContent = avgTAT;
    elems.avgWT.textContent = avgWT;
}

function getColor(pid) {
    const colors = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
        'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
        'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
        'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
        'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)'
    ];
    return colors[(pid - 1) % colors.length];
}

function runLocalSimulation(procs, algo, quantum) {
    procs.sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
    let res;
    switch (algo) {
        case 'SRTF': res = simulateSRTF(procs); break;
        case 'Round Robin': res = simulateRR(procs, quantum); break;
        default: res = simulateSRTF(procs);
    }
    return res;
}

function buildTableFromDone(done) {
    const table = done.map(d => ({
        pid: d.pid,
        arrival: d.arrival,
        burst: d.burst,
        ct: d.ct,
        tat: d.ct - d.arrival,
        wt: d.ct - d.arrival - d.burst
    }));
    return { table };
}

function simulateSRTF(arr) {
    const gantt = [], done = [];
    const steps = [];
    let time = 0;
    const list = arr.map(x => ({ ...x, rem: x.burst }));
    
    list.sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);

    if (list.length > 0) {
        time = list[0].arrival;
    }

    while (list.length) {
        const available = list.filter(p => p.arrival <= time);
        
        if (!available.length) {
            const nextArrival = Math.min(...list.map(p => p.arrival));
            if (time < nextArrival) {
                gantt.push({ pid: 'idle', start: time, end: nextArrival });
                steps.push({
                    time: time,
                    currentProcess: null,
                    readyQueue: [],
                    ganttSoFar: [...gantt]
                });
                time = nextArrival;
            }
            continue;
        }
        
        available.sort((a, b) => a.rem - b.rem || a.arrival - b.arrival);
        const p = available[0];
        
        const readyQueue = available.slice(1).map(x => ({
            pid: x.pid,
            remaining: x.rem,
            burst: arr.find(a => a.pid === x.pid).burst
        }));
        
        if (steps.length === 0 || steps[steps.length - 1].time !== time) {
            steps.push({
                time: time,
                currentProcess: {
                    pid: p.pid,
                    remaining: p.rem,
                    burst: arr.find(x => x.pid === p.pid).burst
                },
                readyQueue: readyQueue,
                ganttSoFar: [...gantt]
            });
        }

        const nextArrival = Math.min(...list.filter(x => x.arrival > time).map(x => x.arrival), Infinity);
        const runTime = Math.min(p.rem, nextArrival - time);
        const start = time;
        time += runTime;
        p.rem -= runTime;
        
        gantt.push({ pid: p.pid, start, end: time });

        if (p.rem <= 0) {
            list.splice(list.findIndex(x => x.pid === p.pid), 1);
            const orig = arr.find(x => x.pid === p.pid);
            done.push({ pid: p.pid, arrival: orig.arrival, burst: orig.burst, ct: time });
        }
    }
    
    steps.push({
        time: time,
        currentProcess: null,
        readyQueue: [],
        ganttSoFar: [...gantt]
    });
    
    return { ...buildTableFromDone(done), gantt, steps };
}

function simulateRR(arr, quantum) {
    const gantt = [], doneMap = new Map();
    const steps = [];
    const list = arr.map(x => ({ ...x, rem: x.burst }));
    list.sort((a, b) => a.arrival - b.arrival || a.pid - b.pid);
    
    let time = list.length > 0 ? list[0].arrival : 0;
    const queue = [];

    while (true) {
        list.filter(p => p.arrival <= time && !queue.includes(p) && !doneMap.has(p.pid))
            .sort((a,b) => a.arrival - b.arrival || a.pid - b.pid)
            .forEach(p => queue.push(p));
        
        if (!queue.length) {
            const remaining = list.filter(p => !doneMap.has(p.pid));
            if (!remaining.length) break;
            const nextArrival = Math.min(...remaining.map(p => p.arrival));
            if (time < nextArrival) {
                gantt.push({ pid: 'idle', start: time, end: nextArrival });
                steps.push({
                    time: time,
                    currentProcess: null,
                    readyQueue: [],
                    ganttSoFar: [...gantt]
                });
                time = nextArrival;
                continue;
            }
        }
        
        const p = queue.shift();
        
        const readyQueue = queue.map(x => ({
            pid: x.pid,
            remaining: x.rem,
            burst: arr.find(a => a.pid === x.pid).burst
        }));
        
        if (steps.length === 0 || steps[steps.length - 1].time !== time) {
            steps.push({
                time: time,
                currentProcess: {
                    pid: p.pid,
                    remaining: p.rem,
                    burst: arr.find(x => x.pid === p.pid).burst
                },
                readyQueue: readyQueue,
                ganttSoFar: [...gantt]
            });
        }
        
        const run = Math.min(quantum, p.rem);
        const start = time;
        time += run;
        p.rem -= run;
        
        gantt.push({ pid: p.pid, start, end: time });
        
        list.filter(x => x.arrival > start && x.arrival <= time && !queue.includes(x) && !doneMap.has(x.pid))
            .sort((a,b) => a.arrival - b.arrival || a.pid - b.pid)
            .forEach(x => queue.push(x));
        
        if (p.rem > 0) {
            queue.push(p);
        } else {
            doneMap.set(p.pid, { pid: p.pid, arrival: p.arrival, burst: p.burst, ct: time });
        }
    }
    
    steps.push({
        time: time,
        currentProcess: null,
        readyQueue: [],
        ganttSoFar: [...gantt]
    });
    
    const done = Array.from(doneMap.values()).sort((a, b) => a.pid - b.pid);
    return { ...buildTableFromDone(done), gantt, steps };
}

refreshProcTable();

if (elems.algo.value === 'Round Robin') {
    elems.quantumWrap.style.display = 'block';
}