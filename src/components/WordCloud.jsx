import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-selection';
import cloud from 'd3-cloud';
import { scaleOrdinal } from 'd3-scale';
import { schemeCategory10 } from 'd3-scale-chromatic';

const WordCloud = ({ words }) => {
    const containerRef = useRef(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Handle Resize
    useEffect(() => {
        const updateDimensions = () => {
            if (containerRef.current) {
                setDimensions({
                    width: containerRef.current.offsetWidth,
                    height: containerRef.current.offsetHeight
                });
            }
        };

        window.addEventListener('resize', updateDimensions);
        updateDimensions(); // Initial

        // ResizeObserver for more robust sizing
        const observer = new ResizeObserver(updateDimensions);
        if (containerRef.current) observer.observe(containerRef.current);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            observer.disconnect();
        };
    }, []);

    // Render Cloud
    useEffect(() => {
        if (dimensions.width === 0 || dimensions.height === 0 || !words || words.length === 0) return;

        // Clear previous SVG
        d3.select(containerRef.current).selectAll('*').remove();

        // Colors
        // Custom pink/purple palette matching the site
        const colors = ['#f472b6', '#fb7185', '#e879f9', '#818cf8', '#60a5fa', '#34d399'];
        const fill = (i) => colors[i % colors.length];

        // Layout
        const layout = cloud()
            .size([dimensions.width, dimensions.height])
            .words(words.map(d => ({ text: d.text, size: d.value }))) // Map data
            .padding(5)
            .rotate(() => (~~(Math.random() * 2) * -90)) // 0 or -90
            .font("'Dancing Script', cursive, sans-serif")
            .fontSize(d => Math.sqrt(d.size) * 10) // Scale size
            .on('end', draw);

        layout.start();

        function draw(words) {
            const svg = d3.select(containerRef.current)
                .append('svg')
                .attr('width', layout.size()[0])
                .attr('height', layout.size()[1])
                .append('g')
                .attr('transform', `translate(${layout.size()[0] / 2},${layout.size()[1] / 2})`);

            svg.selectAll('text')
                .data(words)
                .enter().append('text')
                .style('font-size', d => `${d.size}px`)
                .style('font-family', "'Dancing Script', cursive, sans-serif")
                .style('fill', (d, i) => fill(i))
                .attr('text-anchor', 'middle')
                .attr('transform', d => `translate(${d.x},${d.y})rotate(${d.rotate})`)
                .text(d => d.text)
                .style('opacity', 0)
                .transition().duration(600).style('opacity', 1); // Fade in
        }

    }, [words, dimensions]);

    return (
        <div ref={containerRef} className="w-full h-full" />
    );
};

export default WordCloud;
