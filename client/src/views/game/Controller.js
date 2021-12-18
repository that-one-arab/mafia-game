import { useState, useEffect } from 'react';
import { Svg } from '../../assets/svg';
import './style.css';
function RoleAssignment() {
    return (
        <div>
            <h1>Hello role RoleAssignment</h1>
        </div>
    );
}

function Day() {
    return (
        <div>
            <h1>Day</h1>
        </div>
    );
}

function Night() {
    return (
        <div>
            <h1>Night</h1>
        </div>
    );
}

function Results(params) {
    return (
        <div>
            <h1>Results</h1>
        </div>
    );
}

function AutoSlider() {
    const els = [
        <Svg className={'svg slide-img'} svg='mafia' />,
        <Svg className={'svg slide-img'} svg='doctor' />,
        <Svg className={'svg slide-img'} svg='investigator' />,
    ];

    const [slideIndex, setSlideIndex] = useState(-1);

    useEffect(() => {
        setInterval(() => {
            // console.log({ slideIndex });
            if (slideIndex + 1 === els.length) setSlideIndex(0);
            else setSlideIndex(slideIndex + 1);
        }, 1000);
    }, [slideIndex, els.length]);

    return (
        <div>
            {els.map((el, i) => (
                <div
                    key={i}
                    className={`${
                        slideIndex === i ? 'mySlides-on' : 'mySlides-off'
                    } fade`}
                >
                    <div className='numbertext'> {i + 1} / 3</div>
                    {el}
                    <div className='text'>Caption Text</div>
                </div>
            ))}
            {/* <div className='slideshow-container'>
                <div className='mySlides fade'>
                    <div className='numbertext'>1 / 3</div>
                    <Svg className={'svg'} svg='mafia' />
                    <div className='text'>Caption Text</div>
                </div>
                <div className='mySlides fade'>
                    <div className='numbertext'>1 / 3</div>
                    <Svg className={'svg'} svg='mafia' />
                    <div className='text'>Caption Text</div>
                </div>
                <div className='mySlides fade'>
                    <div className='numbertext'>1 / 3</div>
                    <Svg className={'svg'} svg='mafia' />
                    <div className='text'>Caption Text</div>
                </div>
            </div> */}
            {/* 
            <div style={{ textAlign: 'center' }}>
                <span class='dot'></span>
                <span class='dot'></span>
                <span class='dot'></span>
            </div> */}

            {/* <Svg className={'svg'} svg='mafia' />
            <Svg className={'svg'} svg='villager' />
            <Svg className={'svg'} svg='doctor' />
            <Svg className={'svg'} svg='investigator' /> */}
        </div>
    );
}

export default function Controller() {
    return (
        <div>
            <RoleAssignment />
            <AutoSlider />
        </div>
    );
}
