import {getNumOfComparisonsRange, getExpectedNumOfComparisons} from "./math.js";
import {createRandomPermutation, shuffleArrayByPermutation, mergeSort} from "./array.js";

const rejectCodes = ['resort', 'back', 'stop'];

const createElementFromHtml = htmlString => 
{
    const elem = document.createElement('template');
    elem.innerHTML = htmlString.trim();
    return elem.content;
};

const loadConfig = () =>
{
    const params = new URLSearchParams(document.location.search);
    let config = {};
    try
    {
        if(!params.has('config'))
            return config;
        
        config = JSON.parse(LZString.decompressFromBase64(params.get('config').replaceAll('-', '+' )));

        if(!typeof(config['list'].constructor === Array))
            throw 'Invalid config';
    }
    catch(e)
    {
        console.error(e);
        config = {};
    }

    return config;
};

const copyToClipboard = text =>
{
    navigator.clipboard.writeText(text);
};

const hideElements = elems => (Array.isArray(elems)? elems : [elems]).forEach(elem => elem.classList.add('hidden'));
const unhideElements = elems => (Array.isArray(elems)? elems : [elems]).forEach(elem => elem.classList.remove('hidden'));

document.addEventListener('DOMContentLoaded', () => 
{
    const listElement = document.querySelector('#list');
    const aboutElement = document.querySelector('#about');
    const firstCompareeButton = document.querySelector('#first-comparee-button');
    const secondCompareeButton = document.querySelector('#second-comparee-button');
    const stopButton = document.querySelector('#stop-button');
    const comparisonElement = document.querySelector('#comparison');
    const rankListButton = document.querySelector('#rank-list-button');
    const clearListButton = document.querySelector('#clear-list-button');
    const backButton = document.querySelector('#back-button');
    const afterRankBackButton = document.querySelector('#after-back-button');
    const resetButton = document.querySelector('#reset-button');
    const shareButton = document.querySelector('#share-button');
    const copyButton = document.querySelector('#copy-button');
    const resultsElement = document.querySelector('#results');
    const resultsContainerElement = document.querySelector('#results-container');
    const historyContainerElement = document.querySelector('#history-container');
    const infoElement = document.querySelector('#info');
    const shuffleCheckbox = document.querySelector('#shuffle');
    const linkElement = document.querySelector('#link');
    const historyElement = document.querySelector('#history');
    const comparisonCounter = document.querySelector('#comparison-counter')

    const config = loadConfig();
    let list = config['list']? config['list'] : [];
    let save = config['save']? config['save'].map(i => Boolean(i)) : null;
    let permutation = config['permutation']? config['permutation'] : null;
    let listToRank;

    let saveIndex = 0;

    shuffleCheckbox.checked = save === null || permutation !== null;

    const clearChangingElements = () => 
    {
        resultsElement.innerHTML = '';
        historyElement.innerHTML = '';
        hideElements([historyContainerElement, resultsContainerElement, comparisonElement]);
    };

    const getInputList = () => 
    {
        return listElement.value.split('\n').filter(i => i);
    };
    
    const renderComparisons = size =>
    {
        const range = getNumOfComparisonsRange(size);
        const avg = getExpectedNumOfComparisons(size);
        infoElement.innerHTML = '';
        infoElement.appendChild(createElementFromHtml(`<h3>Info:</h3>`));
        infoElement.appendChild(createElementFromHtml(`<p>List's length: ${size}</p>`));
        infoElement.appendChild(createElementFromHtml(`<p>Comparisons Range: ${range[0]}-${range[1]}</p>`));
        infoElement.appendChild(createElementFromHtml(`<p>Comparisons Average: ${avg.toFixed(2)}</p>`));
    };

    const rankList = async list =>
    {
        clearChangingElements();
        unhideElements(historyContainerElement);
        hideElements(aboutElement);
        renderComparisons(list.length);
        if(save === null)
            save = [];
        mergeSort([...list], inputCompare).then(sorted =>
        {
            clearChangingElements();
            sorted.forEach(val => resultsElement.appendChild(createElementFromHtml(`<li>${val}</li>`)));
            unhideElements([resultsContainerElement]);
        })
        .catch(e => 
        {
            if(!rejectCodes.includes(e))
                console.error(e);
        });
    };

    const backButtonFn = async () =>
    {
        if(save.length === 0)
            stopButtonFn();
        else
        {
            save.pop();
            saveIndex = 0;
            rankList(listToRank);
        }
    };

    const stopButtonFn = async () =>
    {
        clearChangingElements();
        unhideElements(aboutElement);
        list = [];
        save = null;
        permutation = null;
    };

    const clearListButtonFn = async () =>
    {
        listElement.value = '';
    };

    const rankListButtonFn = async () =>
    {
        list = getInputList();
        save = [];
        saveIndex = 0;
        if(shuffleCheckbox.checked)
        {
            permutation = createRandomPermutation(list.length);
            listToRank = shuffleArrayByPermutation(list, permutation);
        }
        else
        {
            listToRank = [...list];
            permutation = null;
        }
        rankList(listToRank); 
    };
    
    const inputCompare = async (first, second) => 
    {
        let firstButtonFn, secondButtonFn, resortingFn, inputCompareKeysFn, backFn, stopFn;
        
        return new Promise((resolve, reject) => 
        {
            if(saveIndex < save.length)
                return resolve(save[saveIndex]);

            firstButtonFn = () => resolve(true);
            secondButtonFn = () => resolve(false);
            resortingFn = () => {
                reject('resort');
            };

            backFn = () => 
            {
                backButtonFn();
                reject('back');
            };

            stopFn = () => {
                stopButtonFn();
                reject('stop');
            };
            
            inputCompareKeysFn = e => 
            {
                if(!e.ctrlKey && document.activeElement === listElement)
                    return;
                
                const key = e.key;
                if(key === 'ArrowUp')
                {
                    e.preventDefault();
                    resolve(true);
                }
                else if(key === 'ArrowDown')
                {
                    e.preventDefault();
                    resolve(false);
                }
                else if(e.ctrlKey && (key === 'r' || key === 'R') || key === 'ArrowRight' || key === ' ')
                {
                    e.preventDefault();
                    resolve(Math.round(Math.random())? true : false);
                }
                else if(e.ctrlKey && (key === 'b' || key === 'B') || key === 'ArrowLeft')
                {
                    e.preventDefault();
                    backFn();
                }
                else if(e.ctrlKey && (key === 's' || key === 'S'))
                {
                    e.preventDefault()
                    stopFn();
                }
                else if(e.ctrlKey && key === 'Enter' || key === ' ')
                    resortingFn();
            };

            comparisonCounter.innerText = save.length + 1;
            firstCompareeButton.innerText = first;
            secondCompareeButton.innerText = second;
            firstCompareeButton.addEventListener('pointerup', firstButtonFn);
            secondCompareeButton.addEventListener('pointerup', secondButtonFn);
            backButton.addEventListener('pointerup', backFn);
            rankListButton.addEventListener('pointerup', resortingFn);
            stopButton.addEventListener('pointerup', stopFn);
            document.addEventListener('keydown', inputCompareKeysFn);

            unhideElements(comparisonElement);
        })
        .then(answer =>
        {
            historyElement.prepend(createElementFromHtml(answer? `<li><b>${first}</b> \> ${second}</li>` : `<li>${first} \< <b>${second}</b></li>`));
            if(saveIndex >= save.length)
                save.push(answer);

            ++saveIndex;
            return answer;
        })
        .finally(() => 
        {
            document.removeEventListener('keydown', inputCompareKeysFn);
            backButton.removeEventListener('pointerup', backFn);
            firstCompareeButton.removeEventListener('pointerup', firstButtonFn);
            secondCompareeButton.removeEventListener('pointerup', secondButtonFn);
            rankListButton.removeEventListener('pointerup', resortingFn);
        });
    };

    const share = () =>
    {
        config['list'] = list.length? list : getInputList();
        config['save'] = save? save.map(i => +i) : null;
        config['permutation'] = permutation? permutation : null;
        const compressedConfig = LZString.compressToBase64(JSON.stringify(config));
        const link = location.protocol + '//' + location.host + location.pathname + '?config=' + compressedConfig.replaceAll('+', '-');
        linkElement.href = link;
        linkElement.classList.remove('invisible')
        copyToClipboard(link);
        if(!shareButton.getAttribute('style'))
        {
            shareButton.setAttribute('style', `text-align: center; font-size: ${0.88 * parseFloat(window.getComputedStyle(shareButton, null).getPropertyValue('font-size'))}px; width:${shareButton.getBoundingClientRect().width}px`)
            shareButton.innerText = 'Copied!';
            setTimeout(() => {shareButton.setAttribute('style', ''); shareButton.innerText = 'Share'}, 1000) 
        }
    };
    
    const copyResults = () =>
    {
        copyToClipboard(Array.from(resultsElement.childNodes).map((res, index) => (index + 1) + '. ' + res.innerText).join('\n'));
        copyButton.setAttribute('style', `width:${copyButton.getBoundingClientRect().width}px`)
        copyButton.innerText = 'Copied!';
        setTimeout(() => {copyButton.setAttribute('style', ''); copyButton.innerText = 'Copy results'}, 1000) 
    };

    const rankFromConfig = () =>
    {
        listElement.value = list.join('\n');
        if(save !== null)
        {
            if(permutation !== null)
                listToRank = shuffleArrayByPermutation(list, permutation);
            else if(shuffleCheckbox.checked)
            {
                permutation = createRandomPermutation(list.length);
                listToRank = shuffleArrayByPermutation(list, permutation);
            }
            else
            {
                listToRank = [...list];
                permutation = null;
            }
            rankList(listToRank);
        }
    };
    
    if(list.length)
        rankFromConfig();

    document.addEventListener('keydown', e => 
    {
        if(!e.ctrlKey && document.activeElement === listElement)
            return;
        const key = e.key;
        if(e.ctrlKey && key === 'Enter')
            rankListButtonFn();
    });
    
    clearListButton.addEventListener('pointerup', clearListButtonFn);
    rankListButton.addEventListener('pointerup', rankListButtonFn);
    shareButton.addEventListener('pointerup', share);
    copyButton.addEventListener('pointerup', copyResults);
    afterRankBackButton.addEventListener('pointerup', backButtonFn);
    resetButton.addEventListener('pointerup', stopButtonFn);
});