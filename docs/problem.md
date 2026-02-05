---
title: "Problem Description"
---

{% include nav.html %}

## Need / context
We are designing an assistive mobility device for **Kinematic/Kinesthetic**, a live performance by the “physically integrated” **AXIS Dance Company**. The goal is not to “fix” disability by imitating non-disabled movement, but to use engineered locomotion as an expressive medium—exploring unfamiliar, “species-atypical,” and/or “superhuman” movement that expands how audiences understand ability and embodiment. :contentReference[oaicite:0]{index=0}

### User
The primary rider is a **wheelchair user** (a person with a disability) who will be transported by the device during performance. The user may sit **cross-legged or in a standard chair posture**, and must have a clear line of sight. :contentReference[oaicite:1]{index=1}

### What the device must do (in plain language)
The robot must move a seated rider around a stage-like space using **leg-initiated locomotion** (wheels may exist as auxiliary load support, but legs must control/initiate motion). It must travel forward/backward and rotate in place (zero turning radius), and it must be safe, robust, and not excessively loud during live performance. :contentReference[oaicite:2]{index=2} :contentReference[oaicite:3]{index=3}

## Goal
Build a **leg-controlled** mobility device that can **reliably transport a seated rider to a designated point within 6 inches in 1 minute**, while remaining safe, robust, portable, and performance-appropriate for a live dance setting. :contentReference[oaicite:4]{index=4} :contentReference[oaicite:5]{index=5}

## Constraints & assumptions

### Environment assumptions
- Testbed floor space is **~10’ x 10’**. :contentReference[oaicite:6]{index=6}
- The final demos use **tape-defined “roadways/channels”** to define straight and curvilinear routes. :contentReference[oaicite:7]{index=7}

### Size, mass, payload, and geometry constraints
- Footprint **≤ 5’ x 5’**. :contentReference[oaicite:8]{index=8}  
- Rider height **2’–3’ off the ground**. :contentReference[oaicite:9]{index=9}  
- Device mass **≤ 150 lb**. :contentReference[oaicite:10]{index=10}  
- Must carry a person up to **170 lb** (and must withstand additional dynamic loads in use). :contentReference[oaicite:11]{index=11}  
- Final demo scoring tasks require operation while carrying a **150 lb payload**. :contentReference[oaicite:12]{index=12}  

### Locomotion / motion constraints
- Locomotion must be **initiated/controlled by legs** (auxiliary wheels/treads may support load bearing). :contentReference[oaicite:13]{index=13}
- Must move at least **forward and backward**. :contentReference[oaicite:14]{index=14}
- Must have **zero-degree turning radius** (rotate CW/CCW in place). :contentReference[oaicite:15]{index=15}
- Must navigate to a designated point within **6” tolerance in 1 minute**. :contentReference[oaicite:16]{index=16}

### Portability / setup constraints
- Must ship in a **3’ x 3’ x 3’ case** and disassemble into **≤ 7 parts**. :contentReference[oaicite:17]{index=17}  
- Preferred: fits through a **36” door when folded** (no disassembly). :contentReference[oaicite:18]{index=18}  
- Assembly from packed state must take **≤ 15 minutes** without soldering/heavy machinery. :contentReference[oaicite:19]{index=19}  

### Power, cost, and build quality constraints
- Battery life **≥ 30 minutes**. :contentReference[oaicite:20]{index=20}
- Typical reimbursable budget guideline: **~$900 total** (course guideline). :contentReference[oaicite:21]{index=21}
- Robust construction required (no “rat’s nest” wiring; avoid duct tape / rickety builds; appearance counts). :contentReference[oaicite:22]{index=22}  

### Sound constraints (performance-critical)
- Must stay under **70 dB** during normal operation at **5 ft** from robot center (short peaks up to 85 dB allowed, limited in duration). :contentReference[oaicite:23]{index=23}  

### Safety constraints
- Must be safe for rider and nearby people: no rough edges, burrs, exposed screw tips; must not damage the environment; ride must be smooth enough to be safe **without strapping** the user in. :contentReference[oaicite:24]{index=24}
- Must include **emergency stop controls**. :contentReference[oaicite:25]{index=25}  

### Control assumptions / allowed control modes
At least one of these control approaches must be used:
1) follow a pre-programmed path, **or**
2) remote control by an operator **20’–50’** away, **or**
3) user control (e.g., joystick). :contentReference[oaicite:26]{index=26}  

### Platform restrictions (important)
- **No laptop in the final machine** (allowed for testing/debugging only). A phone/webcam can be part of the machine only if it remains integrated throughout the course. :contentReference[oaicite:27]{index=27}

## Success criteria (high level)

### Must-haves (core requirements)
- **Leg-initiated locomotion** (aux wheels/treads allowed only as support). :contentReference[oaicite:28]{index=28}  
- **Footprint ≤ 5’ x 5’**, rider height **2’–3’**, robot mass **≤ 150 lb**. :contentReference[oaicite:29]{index=29}  
- Carry payload for evaluation (tasks run with **150 lb**) and support rider mass targets. :contentReference[oaicite:30]{index=30} :contentReference[oaicite:31]{index=31}  
- **Forward + backward travel** and **in-place rotation** (zero turning radius). :contentReference[oaicite:32]{index=32}  
- **Navigation accuracy**: reach a designated point within **6”** in **≤ 1 minute**. :contentReference[oaicite:33]{index=33}  
- **Battery life ≥ 30 minutes**. :contentReference[oaicite:34]{index=34}  
- **Safe + robust** construction with an **E-stop**, and performance-suitable sound levels. :contentReference[oaicite:35]{index=35}  

### Demonstration-oriented requirements (what the final demo will test)
In final demo scoring, the system must complete taped-lane tasks while carrying **150 lb**:
- 10’ straight path within **1 minute**
- 10’ curvilinear path within **90 seconds**
- 10’ backward straight within **90 seconds**
- 10’ backward curvilinear within **2 minutes** :contentReference[oaicite:36]{index=36}  
It must also withstand an **impact test**: a **25 lb** weight dropped from **5’**. :contentReference[oaicite:37]{index=37}  

### Stretch goals / coolness factors (examples encouraged by the spec)
Teams are expected to implement at least one “coolness factor” that goes beyond baseline requirements, such as:
- additional axes of movement / curvilinear motion capability
- variable speed (suggested range **1–4 mph**)
- additional expressive movements beyond locomotion (e.g., leg extension, plié/relevé)
- otherworldly/unique form :contentReference[oaicite:38]{index=38}

## Why this is hard (engineering challenges)
Designing for a live performance context forces several difficult requirements to be satisfied *simultaneously*:

- **High payload + low mass + compact footprint:** The system must carry up to ~170 lb while keeping the device ≤150 lb and within a 5’×5’ footprint, which drives actuator selection, structure stiffness, and stability. :contentReference[oaicite:39]{index=39}  
- **Leg-initiated locomotion with repeatable navigation:** Legs must be the primary locomotor, yet the robot must still hit a 6” positioning tolerance within 1 minute. This challenges kinematics, traction management, and state estimation—especially if compliance or slip is present. :contentReference[oaicite:40]{index=40} :contentReference[oaicite:41]{index=41}  
- **Performance safety without restraints:** The ride must be smooth and safe enough that the rider is not strapped in, which pushes us toward conservative acceleration profiles, robust stability margins, and reliable emergency stopping. :contentReference[oaicite:42]{index=42}  
- **Low noise under real load:** Keeping sound ≤70 dB at 5 ft while moving a heavy payload constrains geartrains, actuation strategy, and mechanical design (resonances, impacts, footfalls). :contentReference[oaicite:43]{index=43}  
- **Portability and rapid setup:** A machine capable of carrying a person must still pack into a 3’ cube, disassemble into ≤7 parts, and reassemble in ≤15 minutes without soldering. That strongly shapes modularity, connectors, and mechanical interfaces. :contentReference[oaicite:44]{index=44} :contentReference[oaicite:45]{index=45}  
- **Robustness and aesthetics:** The system must survive an impact test and avoid “rat’s nest” wiring while looking clean and intentional, which forces early attention to structural protection, strain relief, enclosure design, and cable management. :contentReference[oaicite:46]{index=46} :contentReference[oaicite:47]{index=47}  

## Key risks and mitigations
Below are the main risk areas implied by the requirements, along with how we plan to reduce them.

- **Tip-over / stability risk (high payload, leg motion):**  
  *Mitigation:* keep center of mass low, design wide stable support polygon, validate stability margins early with a weighted mock-up/CAD and incremental load testing. :contentReference[oaicite:48]{index=48}  

- **Insufficient actuator torque / overheating / power budget blow-up:**  
  *Mitigation:* conservative torque sizing with safety factors, thermal checks, current limiting, and early drivetrain prototyping under representative load; maintain a clear power budget tied to the ≥30 min runtime requirement. :contentReference[oaicite:49]{index=49}  

- **Navigation error (6” tolerance) due to slip/compliance:**  
  *Mitigation:* staged autonomy: start with taped-lane following and simple state estimation, then add improved sensing; use repeatable test routines in the 10’×10’ space and track error over time. :contentReference[oaicite:50]{index=50} :contentReference[oaicite:51]{index=51} :contentReference[oaicite:52]{index=52}  

- **Safety / emergency stopping under load:**  
  *Mitigation:* dedicated E-stop hardware, clear “safe states,” and progressive commissioning (no rider → dead weight → rider) with verified stop distances. :contentReference[oaicite:53]{index=53}  

- **Noise exceeds spec:**  
  *Mitigation:* prioritize quieter actuation (lower-impact footfalls, smoother control profiles, vibration isolation) and measure early against the 70 dB @ 5 ft criterion. :contentReference[oaicite:54]{index=54}  

- **Build quality issues late in semester (wiring, robustness, appearance):**  
  *Mitigation:* enforce harnessing/cable management standards from early prototypes, plan for protected electronics mounting, and reserve time for cleanup and enclosure work. :contentReference[oaicite:55]{index=55}  

- **Portability and setup time missed:**  
  *Mitigation:* design for modular breakdown from the start (≤7 modules) with standardized fasteners and connectors; practice timed assembly well before final demo. :contentReference[oaicite:56]{index=56} :contentReference[oaicite:57]{index=57}  
