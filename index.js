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
    }

    return config;
};

const copyToClipboard = text =>
{
    navigator.clipboard.writeText(text);
};

const hideElement = elem => elem.classList.add('hidden');
const unhideElement = elem => elem.classList.remove('hidden');

document.addEventListener('DOMContentLoaded', () => 
{
    const listElement = document.querySelector('#list');
    const firstCompareeButton = document.querySelector('#first-comparee-button');
    const secondCompareeButton = document.querySelector('#second-comparee-button');
    const stopButton = document.querySelector('#stop-button');
    const comparisonElement = document.querySelector('#comparison');
    const rankListButton = document.querySelector('#rank-list-button');
    const clearListButton = document.querySelector('#clear-list-button');
    const backButton = document.querySelector('#back-button');
    const shareButton = document.querySelector('#share-button');
    const copyButton = document.querySelector('#copy-button');
    const resultsElement = document.querySelector('#results');
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
        hideElement(historyElement.parentElement);
        hideElement(resultsElement.parentElement);
        hideElement(infoElement);
        hideElement(comparisonElement);
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
        unhideElement(infoElement);
    };

    const rankList = async list =>
    {
        clearChangingElements();
        unhideElement(historyElement.parentElement);
        renderComparisons(list.length);
        if(save === null)
            save = [];
        mergeSort([...list], inputCompare).then(sorted =>
        {
            clearChangingElements();
            sorted.forEach(val => resultsElement.appendChild(createElementFromHtml(`<li>${val}</li>`)));
            unhideElement(resultsElement.parentElement);
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
                const key = e.key;
                if(key === 'ArrowUp')
                {
                    e.preventDefault()
                    resolve(true);
                }
                else if(key === 'ArrowDown')
                {
                    e.preventDefault()
                    resolve(false);
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
                else if(e.ctrlKey && key === 'Enter')
                    resortingFn();
            };

            comparisonCounter.innerText = save.length + 1;
            firstCompareeButton.innerText = first;
            secondCompareeButton.innerText = second;
            firstCompareeButton.addEventListener('pointerdown', firstButtonFn);
            secondCompareeButton.addEventListener('pointerdown', secondButtonFn);
            backButton.addEventListener('pointerdown', backFn);
            rankListButton.addEventListener('pointerdown', resortingFn);
            stopButton.addEventListener('pointerdown', stopFn);
            document.addEventListener('keydown', inputCompareKeysFn);

            unhideElement(comparisonElement);
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
            backButton.removeEventListener('pointerdown', backFn);
            firstCompareeButton.removeEventListener('pointerdown', firstButtonFn);
            secondCompareeButton.removeEventListener('pointerdown', secondButtonFn);
            rankListButton.removeEventListener('pointerdown', resortingFn);
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
    };
    
    const copyResults = () =>
    {
        copyToClipboard(Array.from(resultsElement.childNodes).map((res, index) => (index + 1) + '. ' + res.innerText).join('\n'));
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
        const key = e.key;
        if(e.ctrlKey && key === 'Enter')
            rankListButtonFn();
    });

    
    clearListButton.addEventListener('pointerdown', clearListButtonFn);
    rankListButton.addEventListener('pointerdown', rankListButtonFn);
    shareButton.addEventListener('pointerdown', share);
    copyButton.addEventListener('pointerdown', copyResults);
});