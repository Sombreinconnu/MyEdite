const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        const canvas = ref(null);
        const activeColor = ref('#4F46E5');
        const selectedFont = ref('Montserrat');
        const palette = ref(['#4F46E5']);

        onMounted(() => {
            canvas.value = new fabric.Canvas('main-canvas', {
                width: 700,
                height: 500,
                backgroundColor: '#ffffff'
            });

            // Gérer la suppression
            window.addEventListener('keydown', (e) => {
                if (e.key === "Delete" || e.key === "Backspace") {
                    const activeObjects = canvas.value.getActiveObjects();
                    canvas.value.remove(...activeObjects);
                    canvas.value.discardActiveObject().renderAll();
                }
            });
        });

        // Fonction Image vers Vectoriel
        const processImage = (e) => {
            const file = e.target.files[0];
            const reader = new FileReader();

            reader.onload = (event) => {
                if (file.type === 'image/svg+xml') {
                    fabric.loadSVGFromString(event.target.result, (objects, options) => {
                        const obj = fabric.util.groupSVGElements(objects, options);
                        addAndCenter(obj);
                    });
                } else {
                    ImageTracer.imageToSVG(event.target.result, (svgString) => {
                        fabric.loadSVGFromString(svgString, (objects, options) => {
                            const obj = fabric.util.groupSVGElements(objects, options);
                            addAndCenter(obj);
                        });
                    }, { ltres:1, qtres:1, pathomit:8, colorsampling:1, numberofcolors:16 });
                }
            };

            if (file.type === 'image/svg+xml') reader.readAsText(file);
            else reader.readAsDataURL(file);
        };

        const addAndCenter = (obj) => {
            obj.scaleToWidth(200);
            canvas.value.add(obj).centerObject(obj).setActiveObject(obj).renderAll();
        };

        const addText = () => {
            const text = new fabric.IText('MON LOGO', {
                left: 100,
                top: 100,
                fontFamily: selectedFont.value,
                fill: activeColor.value,
                fontWeight: 'bold'
            });
            canvas.value.add(text).setActiveObject(text).renderAll();
        };

        const updateColor = () => {
            const activeObj = canvas.value.getActiveObject();
            if (activeObj) {
                if (activeObj.type === 'group') {
                    activeObj.forEachObject(o => o.set('fill', activeColor.value));
                } else {
                    activeObj.set('fill', activeColor.value);
                }
                canvas.value.renderAll();
                if (!palette.value.includes(activeColor.value)) {
                    palette.value.unshift(activeColor.value);
                }
            }
        };

        const downloadSVG = () => {
            const svgData = canvas.value.toSVG();
            const blob = new Blob([svgData], { type: "image/svg+xml" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = "logo-studio.svg";
            link.click();
        };

        const generatePDF = () => {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            doc.setFontSize(22);
            doc.text("IDENTITY BRAND GUIDELINES", 20, 30);
            
            const logoBase64 = canvas.value.toDataURL({ format: 'png' });
            doc.addImage(logoBase64, 'PNG', 20, 50, 80, 50);

            doc.setFontSize(14);
            doc.text("Codes Couleurs :", 20, 120);
            palette.value.slice(0, 5).forEach((color, i) => {
                doc.setFillColor(color);
                doc.rect(20 + (i * 35), 130, 25, 15, 'F');
                doc.setFontSize(8);
                doc.text(color, 20 + (i * 35), 150);
            });

            doc.setFontSize(14);
            doc.text("Police choisie : " + selectedFont.value, 20, 170);

            doc.save("Charte_Graphique.pdf");
        };

        return {
            processImage, addText, updateColor, activeColor, 
            selectedFont, downloadSVG, generatePDF, palette
        }
    }
}).mount('#app');
