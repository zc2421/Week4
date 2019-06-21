//reference:
//https://bl.ocks.org/micahstubbs/e4f5c830c264d26621b80b754219ae1b
// https://www.freecodecamp.org/news/how-to-build-historical-price-charts-with-d3-js-72214aaf6ba3/

$(function () {


    const margin = { top: 20, right: 50, bottom: 30, left: 50 };
    const width = 960 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const parseTime = d3.timeParse("%Y-%m-%d");
    const bisectDate = d3.bisector(d => d.date).left;
    const formatValue = d3.format(',.2f');
    const formatCurrency = d => `$${formatValue(d)}`;

    d3.select('body')
        .style('font', '10px sans-serif')

    const x = d3.scaleTime()
        .range([0, width]);

    const y = d3.scaleLinear()
        .range([height, 0]);

    const line = d3.line()
        .x(d => x(d.date))
        .y(d => y(d.close));

    const svg = d3.select('body').append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);


    //import data
    d3.json('../data/data.json', (error, data) => {
        if (error) throw error;

        data.forEach(function(d){
            d.date = parseTime(d.date);
            d.close = +d.close;
            d.volume = +d.volume;
        });

        data.sort((a, b) => a.date - b.date);



        //display close-date line
        x.domain([data[0].date, data[data.length - 1].date]);
        // y.domain(d3.extent(data, d => d.close));
        y.domain([0, d3.max(data, d => d.close)]);

        svg.append('g')
            .attr('class', 'x axis axis--x')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%Y-%m-%d")));

        svg.append('g')
            .attr('class', 'y axis axis--y')
            .call(d3.axisLeft(y))
            .append('text')
            .attr('class', 'axis-title')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text('Price ($)');

        // style the axes
        d3.selectAll('.axis path')
            .styles({
                fill: 'none',
                stroke: '#000',
                'shape-rendering': 'crispEdges'
            });

        d3.selectAll('.axis line')
            .styles({
                fill: 'none',
                stroke: '#000',
                'shape-rendering': 'crispEdges'
            });

        d3.selectAll('.axis--x path')
            .style('display', 'none');

        svg.append('path')
            .datum(data)
            .attr('class', 'line')
            .attr("fill", "none")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 1.5)
            .attr("stroke-linejoin", "round")
            .attr("stroke-linecap", "round")
            .attr("d", line);




        //display volume
        const volData = data.filter(d => d.volume !== null && d.volume !== 0);
        const yMinVolume = d3.min(volData, d => {
            return Math.min(d.volume);
        });
        const yMaxVolume = d3.max(volData, d => {
            return Math.max(d.volume);
        });
        const yVolumeScale = d3
            .scaleLinear()
            .domain([yMinVolume, yMaxVolume])
            .range([height, 0]);

        svg
            .selectAll()
            .data(volData)
            .enter()
            .append('rect')
            .attr('x', d => {
                return x(d.date);
            })
            .attr('y', d => {
                return yVolumeScale(d.volume);
            })
            .attr('fill', (d, i) => {
                if (i === 0) {
                    return '#03a678';
                } else {
                    return volData[i - 1].close > d.close ? '#c0392b' : '#03a678';
                }
            })
            .attr('width', 1)
            .attr('height', d => {
                return height - yVolumeScale(d.volume);
            });






        //display focus
        const focus = svg.append('g')
            .attr('class', 'focus')
            .style('display', 'none');

        focus.append('circle')
            .attr('r', 4.5);

        focus.append('line')
            .classed('x', true);

        focus.append('line')
            .classed('y', true);

        focus.append('text')
            .attr('x', 9)
            .attr('dy', '.35em');

        svg.append('rect')
            .attr('class', 'overlay')
            .attr('width', width)
            .attr('height', height)
            .on('mouseover', () => focus.style('display', null))
            .on('mouseout', () => focus.style('display', 'none'))
            .on('mousemove', mousemove);

        d3.selectAll('.line')
            .styles({
                fill: 'none',
                stroke: 'steelblue',
                'stroke-width': '1.5px'
            });

        d3.select('.overlay')
            .styles({
                fill: 'none',
                'pointer-events': 'all'
            });

        d3.selectAll('.focus')
            .style('opacity', 0.7);

        d3.selectAll('.focus circle')
            .styles({
                fill: 'none',
                stroke: 'black'
            });

        d3.selectAll('.focus line')
            .styles({
                fill: 'none',
                'stroke': 'black',
                'stroke-width': '1.5px',
                'stroke-dasharray': '3 3'
            });

        function mousemove() {
            const x0 = x.invert(d3.mouse(this)[0]);
            const i = bisectDate(data, x0, 1);
            const d0 = data[i - 1];
            const d1 = data[i];
            const d = x0 - d0.date > d1.date - x0 ? d1 : d0;
            focus.attr('transform', `translate(${x(d.date)}, ${y(d.close)})`);
            focus.select('line.x')
                .attr('x1', 0)
                .attr('x2', -x(d.date))
                .attr('y1', 0)
                .attr('y2', 0);

            focus.select('line.y')
                .attr('x1', 0)
                .attr('x2', 0)
                .attr('y1', 0)
                .attr('y2', height - y(d.close));

            focus.select('text').text(formatCurrency(d.close));
            updateLegends(d);
        }


        //create legend information
        const updateLegends = currentData => {
            console.log("legend");
            d3.selectAll('.lineLegend').remove();
            const legendKeys = Object.keys(data[0]);
            const lineLegend = svg
                .selectAll('.lineLegend')
                .data(legendKeys)
                .enter()
                .append('g')
                .attr('class', 'lineLegend')
                .attr('transform', (d, i) => {
                    return `translate(0, ${i * 20})`;
                });
            lineLegend
                .append('text')
                .text(d => {
                    if (d === 'date') {
                        return `${d}: ${currentData[d].toLocaleDateString()}`;
                    } else {
                        return `${d}: ${currentData[d]}`;
                    }
                })
                .style('fill', 'black')
                .attr('transform', 'translate(25,3)');
        };

    });




});