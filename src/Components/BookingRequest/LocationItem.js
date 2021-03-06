import Datetime from 'react-datetime';
import "react-datetime/css/react-datetime.css";
import moment from 'moment';
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { NOT_EMPTY, ONLY_NUMBER, validation } from "./../../Helpers/validation";
import { Tooltip } from './../Commons/Tooltip';
import { MultipleSelect } from './../Commons/MultipleSelect';
import { callApi } from './../../Helpers/callApi';
import remove from 'lodash/remove';
import { HTTP_METHOD, END_POINT, LOCATION_DEFAULT } from '../../Constants/CommonsConstants';

export const LocationItem = (props) => {
    const [location, setLocation] = useState({ ...LOCATION_DEFAULT });
    const [prevLocation, setPrevLocation] = useState({ ...location });
    const [isUpdate, setIsUpdate] = useState(false);
    const [errors, setErrors] = useState({});
    const [prevError, setPrevError] = useState({ ...errors });
    const [suggestionsEmployee, setSuggestionsEmployee] = useState([]);
    const [isDisabledGuestNameInput, setIsDisabledGuestNameInput] = useState(false);
    const [isDisabledEmployeeNameInput, setIsDisabledEmployeeNameInput] = useState(false);
    const dispatch = useDispatch();
    function handleClick(event) {
        switch (event) {
            case "update": {
                setIsUpdate(true);
                if (location.participants.length > 0) {
                    setIsDisabledEmployeeNameInput(false);
                    setIsDisabledGuestNameInput(true);
                }
                else if (location.guestName != undefined && location.guestName.length != 0) {
                    setIsDisabledEmployeeNameInput(true);
                    setIsDisabledGuestNameInput(false);
                } else {
                    setIsDisabledEmployeeNameInput(false);
                    setIsDisabledGuestNameInput(false);
                }
                break;
            }
            case "cancel":
                setIsUpdate(false);
                setLocation({ ...prevLocation });
                setErrors({ ...prevError });
                break;
            case "save":
                props.onSaveUpdate(location);
                setIsUpdate(false);
                setPrevLocation({ ...location });
                break;
            case "delete":
                props.onDelete(location);
                break;
            default:
                break;
        }
    }
    async function handleChange(e) {
        let validateResult = null;
        switch (e.target.name) {
            case "location": {
                validateResult = validation(e.target.value, [NOT_EMPTY]);
                break;
            }
            case "employeeName": {
                const employeeName = e.target.value;
                if (employeeName.length >= 3) {
                    // const res = await callApi(`https://localhost:5001/api/bkc/employees/${employeeName}`, HTTP_METHOD.GET);
                    const res = await callApi(`${END_POINT}/employees/${employeeName}`, HTTP_METHOD.GET, null);
                    if (res.status !== 200) return;
                    const employees = res.data
                    const suggestionsEmployee = [];
                    for (let i = 0; i < employees.length; i++) {
                        suggestionsEmployee.push({
                            id: employees[i].id,
                            label: employees[i].name + " " + employees[i].buName,
                            content: employees[i].name
                        });
                    }
                    setSuggestionsEmployee(suggestionsEmployee);
                }
                return;
            }
            case "guestName": {
                if (isDisabledGuestNameInput) return;
                const guestName = e.target.value;
                if (guestName.length <= 0) {
                    setIsDisabledEmployeeNameInput(false);
                    setErrors({
                        ...errors,
                        participants: "participant or guestName need to be fill",
                        guestName: "participant or guestName need to be fill"
                    });
                } else {
                    const cloneError = { ...errors };
                    const { guestName: gn, participants: emps, ...rest } = cloneError;
                    setErrors(rest);
                    setIsDisabledEmployeeNameInput(true);
                }
                setLocation({
                    ...location,
                    [e.target.name]: e.target.value
                })
                return;
            }
            case "phone": {
                validateResult = validation(e.target.value, [NOT_EMPTY, ONLY_NUMBER]);
            }
            default:
                break;
        }
        if (!validateResult) {
            let { [e.target.name]: a, ...rest } = errors;
            setErrors(rest);
        }
        else {
            setErrors({
                ...errors,
                [e.target.name]: validateResult
            })
        }
        setLocation({
            ...location,
            [e.target.name]: e.target.value
        })
    }
    function handleChangeTime(momentObject) {
        let time = null;
        if (typeof momentObject === "string" || momentObject instanceof String) {
            time = moment(momentObject, ["H:m", "H:mm"], true);
            if (time.isValid()) {
                let { time: x, ...rest } = errors;
                setErrors(rest);
            } else {
                setErrors({
                    ...errors,
                    time: "This field is not valid"
                })
            }
            setLocation({
                ...location,
                time: time
            })
        } else {
            time = moment(momentObject, ["H:m", "H:mm"], true);
            let { time: x, ...rest } = errors;
            setErrors(rest);
            setLocation({
                ...location,
                time: time.format("H:mm")
            })
        }
    }
    function handleSelectedEmployee(item) {
        const participant = {
            employeeId: item.id,
            employeeName: item.content
        }
        const newParticipants = [...location.participants, participant];
        setLocation({
            ...location,
            participants: newParticipants
        })
        const { participants: emp, guestName: gn, ...rest } = errors;
        setErrors(rest);
        setIsDisabledGuestNameInput(true);
    }
    function handleDeleteEmployee(employeeId) {
        const cloneParticipants = [...location.participants];
        if (cloneParticipants.length === 1) {
            setIsDisabledGuestNameInput(false);
        }
        if (cloneParticipants.length === 1 && location.guestName.length === 0) {
            setErrors({
                ...errors,
                participants: "participant or guestName need to be fill",
                guestName: "participant or guestName need to be fill"
            })
        }
        remove(cloneParticipants, (item) => {
            return item.employeeId === employeeId;
        });
        setLocation({
            ...location,
            participants: cloneParticipants
        })
    }
    useEffect(() => {
        setLocation(props.location);
        setPrevLocation(props.location);
    }, [props.location]);
    return (
        <tr>
            <td className="w_4">
                {props.no}
            </td>
            <td className="w_12">
                <Tooltip active={errors.place ? true : false} content={errors.place} direction="top">
                    {isUpdate ? <input onChange={handleChange} value={location.place} className="form-control" name="place" /> : location.place}

                </Tooltip>
            </td>
            <td className="w_12">
                <Tooltip active={errors.time ? true : false} content={errors.time} direction="top">
                    {
                        isUpdate ?
                            <Datetime
                                dateFormat={false}
                                timeFormat="H:mm"
                                onChange={handleChangeTime}
                                initialValue={location.time}
                            />
                            : location.time
                    }
                </Tooltip>
            </td>
            <td className="w_12">
                <Tooltip active={errors.participants ? true : false} content={errors.participants} direction="top">
                    {
                        isUpdate ?
                            <MultipleSelect
                                suggestions={suggestionsEmployee}
                                onChange={handleChange}
                                className="form-control"
                                name="employeeName"
                                onSelectedItem={handleSelectedEmployee}
                                onDeleteItem={handleDeleteEmployee}
                                initialValue={location.participants && location.participants.map(participant => { return { id: participant.employeeId, content: participant.employeeName } })}
                                isDisabled={isDisabledEmployeeNameInput}
                                isMultipleSelected={true}
                            />
                            :
                            location.participants && location.participants.map(participant => { return participant.employeeName }).join(", ")
                    }
                </Tooltip>

            </td>
            <td className="w_12">
                <Tooltip active={errors.guestName ? true : false} content={errors.guestName} direction="top">
                    {
                        isUpdate ?
                            <input disabled={isDisabledGuestNameInput}
                                onChange={handleChange}
                                value={location.guestName}
                                className="form-control" name="guestName"
                            />
                            : location.guestName
                    }
                </Tooltip>

            </td>
            <td className="w_12">
                <Tooltip active={errors.phone ? true : false} content={errors.phone} direction="top">
                    {isUpdate ? <input onChange={handleChange} value={location.phone} className="form-control" name="phone" /> : location.phone}
                </Tooltip>

            </td>
            <td className="w_12">
                {isUpdate ? <input onChange={handleChange} value={location.note} className="form-control" name="note" /> : location.note}

            </td>
            <td className="w-10">
                <div className="d-flex justify-content-center">
                    <button
                        disabled={Object.keys(errors).length === 0 ? false : true}
                        onClick={() => handleClick(isUpdate ? "save" : "update")}
                        className="btn btn-outline-primary btn-sm mr-2">
                        <i className="fas fa-edit mr-1"></i>
                        {isUpdate ? "LƯU" : "SỬA"}

                    </button>
                    <button
                        onClick={() => handleClick(isUpdate ? "cancel" : "delete")}
                        className="btn btn-outline-danger btn-sm">
                        <i className="fas fa-trash-alt mr-1"></i>
                        {isUpdate ? "HỦY" : "XÓA"}

                    </button>
                </div>
            </td>
        </tr>
    );
}