// Update the current year in the footer
document.getElementById('current-year').textContent = new Date().getFullYear();

// Smooth scrolling for navigation links
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        window.scrollTo({
            top: targetElement.offsetTop - 60,
            behavior: 'smooth'
        });
    });
});

// Add active class to navigation items when scrolling
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('nav a');
    
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        
        if (pageYOffset >= (sectionTop - 200)) {
            currentSection = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === currentSection) {
            link.classList.add('active');
        }
    });
});

// Terminal functionality
const terminalTextElement = document.querySelector('.terminal-prompt .prompt-symbol');
const cursorElement = document.querySelector('.blinking-cursor');

// Simulate typing in the terminal with Python commands
const possibleCommands = [
    'python3 hire_me.py',
    'pip install professional-skills',
    'python -m profile.show_skills',
    'from resume import Experience',
    'python -c "import resume; print(resume.contact())"',
    'cat about.py | python',
    'python -m venv new_opportunity',
    'git clone https://github.com/xiangyang-95/ai-projects.git',
    'sudo apt-get install success',
    'python3 hire_me.py'
];

let currentCommandIndex = 0;
let isErasing = false;
let currentText = 'python3 hire_me.py';
let charIndex = currentText.length;

// Start with "python3 hire_me.py" already typed
setTimeout(() => {
    setInterval(() => {
        if (!isErasing) {
            // After displaying for a while, start erasing
            if (charIndex === currentText.length) {
                setTimeout(() => {
                    isErasing = true;
                }, 2000);
                return;
            }
            
            // Typing effect
            charIndex++;
            if (terminalTextElement.nextSibling && terminalTextElement.nextSibling.nodeType === Node.TEXT_NODE) {
                terminalTextElement.nextSibling.nodeValue = currentText.substring(0, charIndex);
            }
        } else {
            // Erasing effect
            charIndex--;
            
            if (terminalTextElement.nextSibling && terminalTextElement.nextSibling.nodeType === Node.TEXT_NODE) {
                terminalTextElement.nextSibling.nodeValue = currentText.substring(0, charIndex);
            }
            
            // When fully erased, change to the next command
            if (charIndex === 0) {
                isErasing = false;
                currentCommandIndex = (currentCommandIndex + 1) % possibleCommands.length;
                currentText = possibleCommands[currentCommandIndex];
            }
        }
    }, 100);
}, 3000);

// Add code highlighting effect for Python code blocks
document.querySelectorAll('.code-block:not(.typing-effect)').forEach(block => {
    // Python syntax highlighting already applied via spans in HTML
});

// Easter egg - Konami code
let konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let konamiPosition = 0;

document.addEventListener('keydown', function(e) {
    // Check if the key pressed matches the next key in the Konami code
    if (e.key === konamiCode[konamiPosition]) {
        konamiPosition++;
        
        // If the entire Konami code was entered
        if (konamiPosition === konamiCode.length) {
            activateEasterEgg();
            konamiPosition = 0;
        }
    } else {
        konamiPosition = 0;
    }
});

function activateEasterEgg() {
    // Create a Python-like Easter egg animation
    const pythonContainer = document.createElement('div');
    pythonContainer.style.position = 'fixed';
    pythonContainer.style.top = '0';
    pythonContainer.style.left = '0';
    pythonContainer.style.width = '100%';
    pythonContainer.style.height = '100%';
    pythonContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    pythonContainer.style.zIndex = '9999';
    pythonContainer.style.overflow = 'hidden';
    pythonContainer.style.fontFamily = 'monospace';
    
    document.body.appendChild(pythonContainer);
    
    const pythonLogo = document.createElement('div');
    pythonLogo.style.position = 'absolute';
    pythonLogo.style.top = '50%';
    pythonLogo.style.left = '50%';
    pythonLogo.style.transform = 'translate(-50%, -50%)';
    pythonLogo.style.color = '#4b8bbe';
    pythonLogo.style.fontSize = '80px';
    pythonLogo.style.fontWeight = 'bold';
    pythonLogo.style.textAlign = 'center';
    pythonLogo.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center;">
            <span style="color: #4b8bbe">P</span><span style="color: #ffd43b">y</span><span style="color: #4b8bbe">t</span><span style="color: #ffd43b">h</span><span style="color: #4b8bbe">o</span><span style="color: #ffd43b">n</span>
            <div style="margin-left: 15px; font-size: 14px; text-align: left;">
                <pre style="color: #ffd43b">
                  _____
                 /     \\
                |  O O  |
                 \\ = /
                  )=(    <span style="color: #4b8bbe">Python Easter Egg!</span>
                 /   \\
                /     \\
                </pre>
            </div>
        </div>
    `;
    
    pythonContainer.appendChild(pythonLogo);
    
    // Add falling Python symbols
    for (let i = 0; i < 30; i++) {
        const symbol = document.createElement('div');
        
        // Randomly choose a Python keyword or symbol
        const pythonKeywords = ['def', 'class', 'import', 'from', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'lambda', 'return', 'yield', 'pass', 'break', 'continue', '::', '>>>', '...', '@', '#!', '**kwargs'];
        
        const randomKeyword = pythonKeywords[Math.floor(Math.random() * pythonKeywords.length)];
        symbol.textContent = randomKeyword;
        
        symbol.style.position = 'absolute';
        symbol.style.left = Math.random() * 100 + '%';
        symbol.style.top = Math.random() * 100 + '%';
        symbol.style.color = Math.random() > 0.5 ? '#4b8bbe' : '#ffd43b'; // Python blue or yellow
        symbol.style.fontSize = (Math.random() * 20 + 10) + 'px';
        symbol.style.opacity = '0';
        
        pythonContainer.appendChild(symbol);
        
        // Animate the symbol falling
        setTimeout(() => {
            symbol.style.transition = 'all ' + (Math.random() * 3 + 2) + 's ease-in';
            symbol.style.top = '120%';
            symbol.style.opacity = '1';
        }, Math.random() * 1500);
    }
    
    setTimeout(() => {
        const message = document.createElement('div');
        message.style.position = 'absolute';
        message.style.bottom = '20%';
        message.style.left = '50%';
        message.style.transform = 'translateX(-50%)';
        message.style.color = '#FFF';
        message.style.fontSize = '24px';
        message.style.textAlign = 'center';
        message.innerHTML = 'EASTER EGG ACTIVATED<br>You found the Konami code!<br>Click anywhere to continue';
        
        pythonContainer.appendChild(message);
    }, 2000);
    
    pythonContainer.addEventListener('click', () => {
        pythonContainer.remove();
    });
}

// Terminal button interactions
document.querySelectorAll('.terminal-button').forEach(button => {
    button.addEventListener('click', function() {
        const codeBlock = this.closest('.terminal-header').nextElementSibling;
        
        if (this.classList.contains('terminal-close')) {
            const header = this.closest('.terminal-header');
            header.style.display = 'none';
            codeBlock.style.display = 'none';
            
            // Add restore button
            const restoreBtn = document.createElement('button');
            restoreBtn.textContent = 'Restore Terminal';
            restoreBtn.classList.add('restore-terminal');
            restoreBtn.style.margin = '1rem 0';
            restoreBtn.style.padding = '0.5rem 1rem';
            restoreBtn.style.backgroundColor = '#333';
            restoreBtn.style.color = '#fff';
            restoreBtn.style.border = 'none';
            restoreBtn.style.borderRadius = '4px';
            restoreBtn.style.cursor = 'pointer';
            
            codeBlock.parentNode.insertBefore(restoreBtn, header);
            
            restoreBtn.addEventListener('click', function() {
                header.style.display = 'flex';
                codeBlock.style.display = 'block';
                this.remove();
            });
        } else if (this.classList.contains('terminal-minimize')) {
            if (codeBlock.style.display === 'none') {
                codeBlock.style.display = 'block';
            } else {
                codeBlock.style.display = 'none';
            }
        } else if (this.classList.contains('terminal-maximize')) {
            if (codeBlock.style.position === 'fixed') {
                // Restore
                codeBlock.style.position = 'relative';
                codeBlock.style.zIndex = 'auto';
                codeBlock.style.top = 'auto';
                codeBlock.style.left = 'auto';
                codeBlock.style.width = 'auto';
                codeBlock.style.height = 'auto';
            } else {
                // Maximize
                codeBlock.style.position = 'fixed';
                codeBlock.style.zIndex = '1000';
                codeBlock.style.top = '50%';
                codeBlock.style.left = '50%';
                codeBlock.style.transform = 'translate(-50%, -50%)';
                codeBlock.style.width = '80%';
                codeBlock.style.maxHeight = '80vh';
                codeBlock.style.overflow = 'auto';
            }
        }
    });
});