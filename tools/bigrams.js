function bigrams(str){
    const s =str.toLowerCase();
    const v_s=s.split('');
    const v=[];
    for (let i=0; i<v_s.length; i++){
        v[i]=s.slice(i,i+2);
    }
    return v;
}
module.exports = function(str1,str2){
    const bigrams_str1=bigrams(str1);
    const bigrams_str2=bigrams(str2);
    const union=bigrams_str1.length + bigrams_str2.length;
    let hit=0;
    for (let x of bigrams_str1){
        for (y of bigrams_str2){
            if (x===y) hit++;
        }
    }
    if (hit>0){
        return ((2.0*hit)/union);
    }
    return 0.0;
};