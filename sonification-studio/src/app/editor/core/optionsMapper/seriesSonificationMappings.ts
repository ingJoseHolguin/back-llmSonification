import { GenericObject } from '../utils/objects';

// For options where the UI is 0-100, but the option should be 0-1
const hundredToOneTransform = (x: number): number => x / 100;

export class SeriesSonificationMappings {

    public static sonificationEnabled(value: boolean): GenericObject {
        return {
            sonification: {
                enabled: value
            }
        };
    }

    public static instrument(options: GenericObject): GenericObject {
        return {
            sonification: {
                tracks: [{
                    instrument: options.instrument,
                    roundToMusicalNotes: options.pitchRoundingEnabled
                }]
            }
        };
    }

    public static pitchOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('pitch', null, options);
    }

    public static panOptions(options: GenericObject): GenericObject {
        // UI goes from 0-100, mapping is from -1 to +1
        const panValueTranslate = (x: number): number => (x - 50) / 50;
        return SeriesSonificationMappings.getMappedOptions('pan', null, options, panValueTranslate);
    }

    public static volumeOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('volume', null, options, hundredToOneTransform);
    }

    public static durationOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('noteDuration', null, options);
    }

    public static lowpassOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('frequency', 'lowpass', options);
    }

    public static highpassOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('frequency', 'highpass', options);
    }

    public static tremoloDepthOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('depth', 'tremolo', options, hundredToOneTransform);
    }

    public static tremoloSpeedOptions(options: GenericObject): GenericObject {
        return SeriesSonificationMappings.getMappedOptions('speed', 'tremolo', options, hundredToOneTransform);
    }


    /**
     * Since the handling of the mappings for the different properties is very similar,
     * we use this utility to do the generic conversion.
     */
    private static getMappedOptions(
        mappingKey: string,
        parentKey: string|null,
        options: GenericObject,
        valueTransform?: Function
    ): GenericObject {
        const mapped = options.mappingType === 'mapped';
        const fixed = options.mappingType === 'fixed';
        const mapTo = (options.polarity === 'negative' ? '-' : '') + options.mapTo;
        const min = valueTransform ? valueTransform(options.min) : options.min;
        const max = valueTransform ? valueTransform(options.max) : options.max;
        const fixedValue = valueTransform ? valueTransform(options.fixedValue) : options.fixedValue;
        const propObject = { [mappingKey]: mapped ? { mapTo, min, max} : fixedValue };

        if (!mapped && !fixed) {
            return {};
        }

        return {
            sonification: {
                tracks: [{
                    mapping: parentKey ? { [parentKey]: propObject } : propObject
                }]
            }
        };
    }
}
