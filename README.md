# DNSLYTIC

**DNS Intelligence & Lookup Tool**

A lightweight web-based DNS lookup tool designed to inspect domain DNS records quickly and present the results in a clear, human-readable format.

<p align="center">
  <a href="https://dnslytic.vercel.app/">
    <strong>→ Visit DNSLYTIC</strong>
  </a>
</p>

---

## About

DNSLYTIC is a simple DNS intelligence tool built for learning, network discovery, and understanding how DNS works behind the scenes.

Instead of displaying raw DNS responses that can be difficult to understand, DNSLYTIC organizes common DNS records into readable sections and explains what each record type means.

The project was built as a practical networking and cybersecurity project while learning about DNS, web development, and security tooling.

---

## Features

- Domain DNS lookup
- IPv4 (`A`) record detection
- IPv6 (`AAAA`) record detection
- Mail server (`MX`) records
- Name server (`NS`) records
- Start of Authority (`SOA`) records
- Certificate Authority Authorization (`CAA`) records
- Human-readable explanations for DNS record types
- DNS response timing
- Resolved / failed lookup status
- Clean and responsive interface
- Simple domain input
- Designed for network discovery and learning

---

## DNS Records Explained

| Record | Meaning | Purpose |
|---|---|---|
| `A` | IPv4 Address | Maps a domain to an IPv4 address |
| `AAAA` | IPv6 Address | Maps a domain to an IPv6 address |
| `MX` | Mail Exchange | Specifies the mail servers responsible for receiving email |
| `NS` | Name Server | Shows the DNS servers responsible for the domain |
| `SOA` | Start of Authority | Contains administrative information about a DNS zone |
| `CAA` | Certificate Authority Authorization | Defines which Certificate Authorities can issue certificates for a domain |

---

## Example

A lookup for a domain can return information such as:

```text
A
142.250.x.x

AAAA
2a00:1450:xxxx::xxxx

MX
smtp.example.com

NS
ns1.example.com
ns2.example.com

SOA
Primary DNS: ns1.example.com
Responsible: admin.example.com
```

DNSLYTIC presents these records in a way that is easier to understand, especially for people who are learning networking and DNS.

---

## Tech Stack

### Backend

- Python
- Flask
- DNS resolution libraries

### Frontend

- HTML5
- CSS3
- JavaScript

### Development

- Kali Linux
- Git
- GitHub
- Visual Studio Code

### Deployment

- Vercel

---

## Project Structure

```text
dns-lookup/
│
├── app.py
├── requirements.txt
│
├── screenshots/
│
├── static/
│   ├── css/
│   └── js/
│
├── templates/
│   └── index.html
│
├── .gitignore
└── README.md
```

---

## Running Locally

### 1. Clone the repository

```bash
git clone git@github.com:aahadparvaiz/dnslytic.git
```

### 2. Enter the project directory

```bash
cd dnslytic
```

### 3. Create a virtual environment

```bash
python3 -m venv venv
```

### 4. Activate the virtual environment

On Linux / Kali Linux:

```bash
source venv/bin/activate
```

### 5. Install dependencies

```bash
pip install -r requirements.txt
```

### 6. Start the application

```bash
python3 app.py
```

The application will then be available through your local Flask server.


---

## Why I Built DNSLYTIC

DNS is one of the fundamental components of the Internet, but raw DNS information can be confusing when you're first learning networking.

I built DNSLYTIC as a practical project to:

- Understand how DNS works
- Work with DNS records programmatically
- Practice Python and Flask
- Improve frontend development skills
- Learn more about network reconnaissance
- Build a useful cybersecurity-oriented tool
- Create something that can be used for learning and experimentation

---

## Disclaimer

DNSLYTIC is intended for **educational, defensive, and legitimate network discovery purposes**.

Only perform DNS reconnaissance and security testing on domains and systems that you own or have permission to assess.

---

## Author

**Aahad Parvaiz**

Computer Science student interested in:

- Cybersecurity
- Ethical Hacking
- Offensive Security
- Networking
- Entrepreneurship
- Technology

---

## Project Status

**Active Development**

DNSLYTIC is an ongoing learning project and new features will be added as the project develops.

---

<p align="center">
  Built for network discovery & learning.
</p>
