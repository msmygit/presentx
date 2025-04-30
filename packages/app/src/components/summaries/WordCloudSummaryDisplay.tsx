import React, { useEffect, useRef } from 'react';
import { WordCloudSummary } from '@presentx/shared';
import * as d3 from 'd3';
import d3Cloud from 'd3-cloud';

interface WordCloudSummaryDisplayProps {
    summary: WordCloudSummary;
}

// Simple color pool for word cloud
const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

const WordCloudSummaryDisplay: React.FC<WordCloudSummaryDisplayProps> = ({ summary }) => {
    const { top_words } = summary;
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        if (!top_words || Object.keys(top_words).length === 0 || !svgRef.current) {
            // Clear previous cloud if data is empty
             if (svgRef.current) {
                d3.select(svgRef.current).selectAll("*").remove();
            }
            return;
        }

        const container = d3.select(svgRef.current.parentElement);
        if (!container.node()) return; 
        
        // Use ResizeObserver for better performance than window resize listener
        let width = 300;
        let height = 200;
        const observer = new ResizeObserver(entries => {
            if (entries[0]) {
                const newWidth = entries[0].contentRect.width;
                const newHeight = Math.max(200, newWidth * 0.6);
                if (newWidth !== width || newHeight !== height) {
                    width = newWidth;
                    height = newHeight;
                    drawCloud(); // Redraw on resize
                }
            }
        });
        observer.observe(svgRef.current.parentElement!);

        // Convert summary data to the format expected by d3-cloud
        const words = Object.entries(top_words).map(([text, value]) => ({ text, size: value }));
        
        // Scale font size based on word count (value)
        const minSize = words.reduce((min, w) => Math.min(min, w.size), Infinity);
        const maxSize = words.reduce((max, w) => Math.max(max, w.size), -Infinity);
        const fontSizeScale = d3.scaleSqrt() // Sqrt scale often looks good for word clouds
            .domain([minSize, maxSize])
            .range([12, 60]); // Min/max font size in pixels

        const drawCloud = () => {
            if (!svgRef.current) return;
            const svg = d3.select(svgRef.current);
            
            // Clear previous elements
            svg.selectAll("*").remove();

            const layout = d3Cloud()
                .size([width, height])
                .words(words.map(d => ({ ...d, size: fontSizeScale(d.size) }))) // Apply font size scale
                .padding(3) // Padding between words
                .rotate(() => (Math.random() > 0.7 ? 90 : 0)) // Random rotation (optional)
                .font("sans-serif")
                .fontSize(d => d.size!)
                .on("end", draw);

            layout.start();

            function draw(calculatedWords: d3Cloud.Word[]) {
                if (!svgRef.current) return;

                svg.attr("width", layout.size()[0])
                   .attr("height", layout.size()[1])
                   .append("g")
                   .attr("transform", `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`)
                   .selectAll("text")
                   .data(calculatedWords)
                   .enter().append("text")
                   .style("font-size", d => `${d.size}px`)
                   .style("font-family", "sans-serif") // Match layout font
                   .style("fill", (d, i) => colors[i % colors.length]) // Cycle through colors
                   .attr("text-anchor", "middle")
                   .attr("transform", d => `translate(${d.x}, ${d.y})rotate(${d.rotate})`)
                   .text(d => d.text!);
            }
        }

        drawCloud(); // Initial draw

        // Cleanup observer on unmount
         return () => observer.disconnect();

    }, [top_words]); // Rerun effect if top_words changes

    return (
        <div className="w-full h-auto min-h-[200px]">
            {(!top_words || Object.keys(top_words).length === 0) && (
                 <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-10">No responses yet or word data unavailable.</p>
            )} 
            <svg ref={svgRef}></svg>
        </div>
    );
};

export default WordCloudSummaryDisplay; 